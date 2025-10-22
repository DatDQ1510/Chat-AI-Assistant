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
        files?: AttachedFile[];
      }, callback?: (response: { success: boolean; error?: string; errorCode?: number }) => void) => {
        const { conversation_id, content, needs_suggestions = false, files } = payload || {};

        try {
          // Validation
          if (!conversation_id || !content || !content.trim()) {
            const errorResponse = { success: false, error: "Invalid conversation_id or empty content", errorCode: 400 };
            if (callback) callback(errorResponse);
            return;
          }
          if (needs_suggestions) console.log("💡 Suggestions requested");
          
          // ✅ STEP 1: Save user message first (optimistic approach)
          const userMessage = await messageService.createMessage(
            conversation_id,
            "user",
            user_id ?? null,
            null,
            content
          );
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
              created_at: new Date().toISOString(),
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
