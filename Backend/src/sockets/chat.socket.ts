// src/sockets/chat.socket.ts
import { Server, Socket } from "socket.io";
import messageService from "../services/message.service.js";
import { generatorService } from "../services/generator.service.js";
import contextService from "../services/context.service.js";
import { socketManager } from "./socket.manager.js";
import { retrySendMessage } from "./message.retry.js";
import { addToFailedMessageQueue } from "../queues/message.queue.js";


interface AttachedFile {
  uid: string;
  name: string;
  type: string;
  file: File;
  preview?: string;
}
export const chatSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    const user_id = (socket as any).user?.id;
    // Track online users using socketManager
    if (user_id) {
      socketManager.addUser(user_id, socket.id);
      const socketsCount = socketManager.getSockets(user_id).length;
      console.log(`👤 User ${user_id} is online with ${socketsCount} connection(s)`);
      
      // Broadcast user online status to their conversations
      io.emit("user_status", { userId: user_id, status: "online" });
    }

    // Join conversation room
    socket.on("join_conversation", (conversationId: string) => {
      if (!conversationId) {
        console.warn("⚠️ Empty conversation_id received");
        return;
      }
      socket.join(conversationId);
      console.log(`� Socket ${socket.id} joined room ${conversationId}`);
    });

    // Handle sending message
    socket.on(
      "send_message",
      async (payload: { 
        conversation_id: string; 
        user_id?: string | null; 
        content: string;
        needs_suggestions?: boolean;
        file_urls?: string[]; // ✅ Support file URLs
      }, callback?: (response: { success: boolean; error?: string; errorCode?: number }) => void) => {
        const { conversation_id, content, needs_suggestions = false, file_urls } = payload || {};

        try {
          // Validation
          if (!conversation_id || !content || !content.trim()) {
            const errorResponse = { success: false, error: "Invalid conversation_id or empty content", errorCode: 400 };
            if (callback) callback(errorResponse);
            return;
          }
          if (needs_suggestions) console.log("💡 Suggestions requested");
          
          // ✅ STEP 1: Save user message first (optimistic approach)
          const result = await messageService.createMessage(
            conversation_id,
            "user",
            user_id ?? null,
            null,
            content,
            file_urls // ✅ Pass file_urls to save in DB
          );
          const userMessage = result.message;
          const autoRenamedTo = result.autoRenamedTo;
          
          // ✅ STEP 1.5: Emit saved user message to all clients in room
          io.to(conversation_id).emit("user_message_saved", {
            id: (userMessage as any).id,
            conversation_id,
            role: "user",
            content,
            sender_type: "user",
            attachments: file_urls || [], // ✅ Include file URLs
            createdAt: (userMessage as any).createdAt || new Date().toISOString(),
            updatedAt: (userMessage as any).updatedAt || new Date().toISOString(),
          });
          console.log(`✅ User message saved and emitted: ${(userMessage as any).id}${file_urls?.length ? ` with ${file_urls.length} file(s)` : ''}`);

          // ✅ STEP 1.6: Emit conversation updated event to trigger list refresh
          console.log(`🔍 Checking user_id for list update emit:`, { user_id, has_user_id: !!user_id });
          if (user_id) {
            // Emit to all sockets of this user
            const userSockets = socketManager.getSockets(user_id);
            console.log(`📢 Found ${userSockets.length} socket(s) for user ${user_id}`);
            userSockets.forEach((socketId: string) => {
              io.to(socketId).emit("conversation_list_updated", {
                conversation_id,
                action: "message_added",
                timestamp: new Date().toISOString(),
                autoRenamedTo, // ✅ Include auto-rename info
              });
            });
            console.log(`📢 Conversation list update emitted to user ${user_id}'s ${userSockets.length} connection(s)${autoRenamedTo ? ` (auto-renamed to: "${autoRenamedTo}")` : ''}`);
          } else {
            console.warn(`⚠️ No user_id provided, skipping conversation_list_updated event`);
          }

          
          // ✅ STEP 2: Acknowledge receipt to frontend
          if (callback) {
            callback({ success: true });
          }

          // ✅ STEP 3: Create temp AI message ID for streaming
          const aiMessageId = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
          
          // ✅ STEP 4: Try to get AI response
          try {
            // Build context for AI
            const context = await contextService.buildPrompt(conversation_id, content, user_id, needs_suggestions);
            console.log(`🧠 Context built for conversation ${conversation_id} ::`, context);
            const maxTokens = needs_suggestions ? 5000 : 4000;
            console.log(`🎯 Token limit: ${maxTokens} (suggestions: ${needs_suggestions})`);
            
            // ✅ Emit AI message init BEFORE streaming (so frontend shows "AI is typing...")
            io.to(conversation_id).emit("ai_message_init", {
              id: aiMessageId,
              conversation_id,
              role: "assistant",
              content: "",
              createdAt: new Date().toISOString(),
            });

            // Start AI stream
            const stream = await generatorService.streamReply(context.systemPrompt, context.userPrompt, maxTokens);
            
            let aiFullReply = "";
            let receivedAny = false;
            let chunkCount = 0;

            // Stream chunks to clients
            for await (const chunkObj of stream) {
              const chunkText = typeof chunkObj === "string" ? chunkObj : (chunkObj as any).text ?? "";
              if (!chunkText) continue;

              receivedAny = true;
              aiFullReply += chunkText;
              chunkCount++;

              io.to(conversation_id).emit("ai_stream", {
                message_id: aiMessageId,
                chunk: chunkText,
                conversation_id
              });
            }

            console.log(`📊 Streamed ${chunkCount} chunks, total ${aiFullReply.length} characters`);

            // Fallback if AI returns empty
            if (!receivedAny || !aiFullReply.trim()) {
              aiFullReply = "I couldn't generate a response right now. Please try rephrasing or try again later.";
              console.warn("⚠️ AI returned empty response, using fallback message");
            }

            // Save AI message to database
            const aiMessage = await messageService.createMessage(
              conversation_id,
              "chatbot",
              null,
              null,
              aiFullReply
            );
            console.log(`✅ AI message saved: ${(aiMessage as any).id}`);

            // Emit stream end
            io.to(conversation_id).emit("ai_stream_end", {
              message_id: aiMessageId,
              real_message_id: (aiMessage as any).id,
              full_content: aiFullReply,
              conversation_id
            });

            // ✅ Emit conversation updated event after AI response
            if (user_id) {
              const userSockets = socketManager.getSockets(user_id);
              userSockets.forEach((socketId: string) => {
                io.to(socketId).emit("conversation_list_updated", {
                  conversation_id,
                  action: "ai_replied",
                  timestamp: new Date().toISOString(),
                });
              });
              console.log(`📢 Conversation list update (AI) emitted to user ${user_id}`);
            }

          } catch (aiError: any) {
            // ✅ AI failed - emit error to frontend but don't crash
            console.error("❌ AI generation failed:", aiError.message);
            
            // Emit AI error event to frontend
            io.to(conversation_id).emit("ai_error", {
              message_id: aiMessageId,
              conversation_id,
              error: "AI service temporarily unavailable",
              errorCode: 500
            });
            
            // Don't throw - user message is already saved, just AI failed
            return;
          }

        } catch (err: any) {
          console.error("❌ Error in send_message handler:", err);
          
          const errorResponse = { 
            success: false, 
            error: err?.message ?? "Internal server error",
            errorCode: 500
          };
          
          if (callback) {
            callback(errorResponse);
          }
        }
      }
    );

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      const userId = (socket as any).user?.id;
      if (userId) {
        socketManager.removeUser(userId, socket.id);
        
        if (!socketManager.isUserOnline(userId)) {
          console.log(`👤 User ${userId} is now offline`);
          
          // Broadcast user offline status
          io.emit("user_status", { userId, status: "offline" });
        } else {
          const remainingSockets = socketManager.getSockets(userId).length;
          console.log(`👤 User ${userId} still has ${remainingSockets} connection(s)`);
        }
      }
    });
  });
};
