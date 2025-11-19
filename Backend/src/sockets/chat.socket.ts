import { Server, Socket } from "socket.io";
import messageService from "../services/message.service.js";
import { generatorService } from "../services/generator.service.js";
import contextService from "../services/context.service.js";
import { socketManager } from "./socket.manager.js";
import readPdfFromUrl from "../utils/readPdf.js";
import redisConnection from "../config/redis.js";
import processUserMessage from "../memory/processUserMessage.js";
import conversationStarterService from "../services/conversationStarter.service.js";
import messageRepository from "../repositories/message.repository.js";
import readImageTextFromUrl from "../utils/readImageText.js";

// Định nghĩa types rõ ràng
interface AttachedFile {
  uid: string;
  name: string;
  type: string;
  file: File;
  preview?: string;
}

interface SendMessagePayload {
  conversation_id: string;
  user_id?: string | null;
  content?: string;
  needs_suggestions?: boolean;
  file_urls?: string[]; // Support file URLs
}

// ✅ NEW: Interface for generate_suggestions event
interface GenerateSuggestionsPayload {
  conversation_id: string;
  message_id: string; // ID của message AI cần generate suggestions
}

// ✅ NEW: Interface for conversation starters
interface GetConversationStartersPayload {
  conversation_id: string;
}

interface ErrorResponse {
  success: boolean;
  error?: string;
  errorCode?: number;
}

class ChatSocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  // Hàm chính: Setup listeners
  public setupListeners(socket: Socket) {
    const user_id = (socket as any).user?.id;

    this.handleConnection(socket, user_id);
    socket.on("join_conversation", (conversationId: string) => this.handleJoinConversation(socket, conversationId));
    socket.on("send_message", (payload: SendMessagePayload, callback?: (response: ErrorResponse) => void) =>
      this.handleSendMessage(socket, payload, callback)
    );
    socket.on("suggest_ideas", (payload: SendMessagePayload, callback?: (response: ErrorResponse) => void) => {
      this.handleSuggestIdeas(socket, payload, callback);
    });
    
    // ✅ NEW: Listen for generate_suggestions event
    socket.on("generate_suggestions", (payload: GenerateSuggestionsPayload, callback?: (response: ErrorResponse) => void) => {
      this.handleGenerateSuggestions(socket, payload, callback);
    });
    
    // ✅ NEW: Listen for get_conversation_starters event
    socket.on("get_conversation_starters", (payload: GetConversationStartersPayload, callback?: (response: ErrorResponse) => void) => {
      this.handleGetConversationStarters(socket, payload, callback);
    });
    
    socket.on("disconnect", () => this.handleDisconnect(socket, user_id));
  }

  private handleConnection(socket: Socket, user_id?: string) {
    if (!user_id) return;

    socketManager.addUser(user_id, socket.id);
    this.io.emit("user_status", { userId: user_id, status: "online" });
  }

  private handleJoinConversation(socket: Socket, conversationId: string) {
    if (!conversationId) return;
    socket.join(conversationId);
  }

  /**
   * ✅ NEW: Handle generate_suggestions event
   * Generate 3 follow-up questions for a specific AI message
   */
  private async handleGenerateSuggestions(
    socket: Socket,
    payload: GenerateSuggestionsPayload,
    callback?: (response: ErrorResponse) => void
  ) {
    const { conversation_id, message_id } = payload;
    const user_id = (socket as any).user?.id;
    console.log(`Received generate_suggestions for message: ${message_id} in conversation: ${conversation_id}`);
    try {
      // Validation
      if (!conversation_id || !message_id) {
        return this.sendError("Invalid conversation_id or message_id", 400, callback);
      }

      console.log(`🔥 Generating suggestions for message: ${message_id} in conversation: ${conversation_id}`);

      

      // STEP 2: Build context từ conversation history
      const context = await contextService.buildPrompt(
        conversation_id,
        "Generate 3 follow-up questions based on the conversation above",
        user_id,
        undefined
      );
      console.log("Built context for suggestions:", context);
      // STEP 3: Update system prompt để yêu cầu JSON format với suggestions
      const suggestionsSystemPrompt = `${context.systemPrompt}

      You must respond in JSON format with the following structure:
      {
        "suggestions": ["question 1", "question 2", "question 3"]
      }

      Generate exactly 3 follow-up questions that:
      1. Are relevant to the conversation context
      2. Help the user explore the topic deeper
      3. Are concise (max 15 words each)
      4. Are in the same language as the conversation

      Example:
      {
        "suggestions": [
          "Can you explain more about X?",
          "What are the benefits of Y?",
          "How does Z compare to other options?"
        ]
      }`;

      const suggestionsUserPrompt = "Based on our conversation above, generate 3 relevant follow-up questions that would help me explore this topic further.";

      // STEP 4: Call AI to generate suggestions (JSON format)
      console.log("📝 Calling AI to generate suggestions...");
      const aiResponse = await generatorService.getFullJsonResponse(
        suggestionsSystemPrompt,
        suggestionsUserPrompt
      );
      console.log("AI response for suggestions:", aiResponse);
      const suggestions = aiResponse.suggestions || [];
      
      if (suggestions.length === 0) {
        console.warn("⚠️ AI returned no suggestions");
        return this.sendError("Failed to generate suggestions", 500, callback);
      }

      console.log(`✅ Generated ${suggestions.length} suggestions:`, suggestions);

      // STEP 5: Emit suggestions_generated event to all clients in the room
      this.io.to(conversation_id).emit("suggestions_generated", {
        message_id,
        conversation_id,
        suggestions,
      });
      console.log("🚀 Emitted suggestions_generated event");
      // STEP 6: Acknowledge success
      if (callback) {
        callback({ success: true });
      }

    } catch (error: any) {
      console.error("❌ Error generating suggestions:", error);
      this.sendError(error.message ?? "Failed to generate suggestions", 500, callback);
      
      // Emit error to frontend
      this.io.to(conversation_id).emit("suggestions_error", {
        message_id,
        conversation_id,
        error: "Failed to generate suggestions",
      });
    }
  }

  /**
   * ✅ NEW: Handle get_conversation_starters event
   * Generate smart conversation starters based on user's history and memories
   */
  private async handleGetConversationStarters(
    socket: Socket,
    payload: GetConversationStartersPayload,
    callback?: (response: ErrorResponse) => void
  ) {
    const { conversation_id } = payload;
    const user_id = (socket as any).user?.id;

    console.log(`📋 Received get_conversation_starters for conversation: ${conversation_id}`);

    try {
      // Validation
      if (!conversation_id || !user_id) {
        return this.sendError("Invalid conversation_id or user_id", 400, callback);
      }

      console.log(`🎯 Generating conversation starters for user ${user_id}...`);

      // Generate starters using the service
      const starters = await conversationStarterService.generateStarters(
        user_id,
        conversation_id,
        10 // Last 10 messages
      );

      console.log(`✅ Generated ${starters.length} conversation starters`);

      // Send starters back to client
      socket.emit("conversation_starters", {
        conversation_id,
        starters,
      });

      // Acknowledge success
      if (callback) {
        callback({ success: true });
      }
    } catch (error: any) {
      console.error("❌ Error generating conversation starters:", error);
      this.sendError(error.message ?? "Failed to generate starters", 500, callback);
      
      // Send fallback starters on error
      socket.emit("conversation_starters", {
        conversation_id,
        starters: conversationStarterService.getFallbackSuggestions(),
      });
    }
  }

  private async handleSuggestIdeas(socket: Socket, payload: SendMessagePayload, callback?: (response: ErrorResponse) => void) {
    const user_id =   (socket as any).user?.id;
    if (!user_id) return;
    // Implement suggest ideas logic here
    const { conversation_id } = payload;
    try {
      if (!conversation_id) { 
        return this.sendError("Invalid conversation_id", 400, callback);
      }
      const content = "Đưa ra 3 câu hỏi gợi ý theo nội dụng cuộc hội thoại trên";
      const aiMessageId = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const needs_suggestions = true;
      const text_file_urls = "";
      await this.handleAIResponse(conversation_id, content, user_id, text_file_urls, aiMessageId, needs_suggestions);
    }
    catch (err: any) {
      this.sendError(err.message ?? "Internal server error", 500, callback);
    }
  } 

  private async handleSendMessage(
    socket: Socket,
    payload: SendMessagePayload,
    callback?: (response: ErrorResponse) => void
  ) {
    const { conversation_id, content, file_urls } = payload;
    const user_id = (socket as any).user?.id;

    try {
      // Validation
      if (!conversation_id || !content?.trim()) {
        return this.sendError("Invalid conversation_id or empty content", 400, callback);
      }
      
      // Lấy số lượng message hiện có trong conversation
      const count : number = await messageRepository.countMessagesByConversationId(conversation_id);
      let recentMessages = [];
      if(count == 0) {
        // add context từ content của cuộc hội thoại gần đây
        recentMessages = await messageRepository.lastMessages(10);

      }
      let contentWithRecentContext = content + recentMessages.map(m => m.content).join(" ");
      // Xử lý file (nếu có)
      let text_file_urls = "";
      if (file_urls && file_urls.length > 0) {
        console.log("Processing file URLs for text extraction:", file_urls);
        if((file_urls[0] as any)?.type === 'application/pdf')
          text_file_urls = await readPdfFromUrl((file_urls[0] as any)?.url); 
        else  text_file_urls = await readImageTextFromUrl((file_urls[0] as any)?.url); // TODO: Handle multiple files if needed
      } 

      // STEP 1: Save user message
      const result = await messageService.createMessage(
        conversation_id,
        "user",
        user_id ?? null,
        null,
        content,
        file_urls
      );
      
      // ✅ STEP 1.5: Process user message to extract and save memories
      if (user_id && content.trim()) {
        console.log("🧠 Processing user message for memory extraction...");
        // Run in background, don't await to avoid blocking response
        processUserMessage(user_id, content).catch((err) => {
          console.error("❌ Error processing user message for memories:", err);
        });
      }
      
      // ✅ Set cache với đúng format (content + sender_type)
      const key = `recentMessages:${conversation_id}`;
      await redisConnection.lpush(key, JSON.stringify({ 
        content: result.message.content,
        sender_type: "user" 
      }));
      await redisConnection.ltrim(key, 0, 5);
      const userMessage = result.message;

      // STEP 1.5: Emit saved user message
      this.io.to(conversation_id).emit("user_message_saved", {
        id: (userMessage as any).id,
        conversation_id,
        role: "user",
        content,
        sender_type: "user",
        attachments: file_urls || [],
        createdAt: (userMessage as any).createdAt || new Date().toISOString(),
        updatedAt: (userMessage as any).updatedAt || new Date().toISOString(),
      });

      // STEP 1.6: Emit conversation updated
      this.emitConversationUpdated(user_id, conversation_id, "message_added", result.autoRenamedTo);

      // STEP 2: Acknowledge to frontend
      if (callback) callback({ success: true });

      // STEP 3: Generate temp AI message ID
      const aiMessageId = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      // STEP 4: Get AI response
      if ( count == 0) await this.handleAIResponse(conversation_id, contentWithRecentContext, user_id, text_file_urls, aiMessageId)
      
      else  await this.handleAIResponse(conversation_id, content, user_id, text_file_urls, aiMessageId);
    } catch (err: any) {
      this.sendError(err.message ?? "Internal server error", 500, callback);
    }
  }

  private async handleAIResponse(
    conversation_id: string,
    content: string,
    user_id: string | null | undefined,
    text_file_urls?: string,
    aiMessageId?: string,
    needs_suggestions: boolean = false
    ) {
    try {
      const context = await contextService.buildPrompt(
        conversation_id,
        content,
        user_id,
        text_file_urls
      );
      console.log("Built context:", context);
      // Emit AI đang gõ
      this.io.to(conversation_id).emit("ai_message_init", {
        id: aiMessageId,
        conversation_id,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      });

      let aiFullReply = "";
      let suggestions: string[] = [];

      if (needs_suggestions) {
        const fullResponse = await generatorService.getFullJsonResponse(
          context.systemPrompt,
          context.userPrompt
        );
        console.log("Full AI response (JSON):", fullResponse);
        aiFullReply = fullResponse.answer || "Không có phản hồi.";
        suggestions = fullResponse.suggestions || [];
        console.log("Parsed AI answer and suggestions:", aiFullReply, suggestions);
        const words = aiFullReply.split(" ");
        let streamedSoFar = "";

        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(" ") + " ";
          streamedSoFar += chunk;

          this.io.to(conversation_id).emit("ai_stream", {
            message_id: aiMessageId,
            chunk,
            conversation_id,
          });
          console.log("Streamed chunk:", chunk);
          await new Promise((resolve) => setTimeout(resolve, 50)); // 50ms delay
        }

        aiFullReply = streamedSoFar;
      } 
      else {
        // === CÁCH CŨ: STREAM THẬT ===
        const stream = await generatorService.streamReply(
          context.systemPrompt,
          context.userPrompt,
          4000
        );

        for await (const chunkObj of stream) {
          const chunkText = typeof chunkObj === "string" ? chunkObj : (chunkObj as any).text ?? "";
          if (!chunkText) continue;

          aiFullReply += chunkText;
          this.io.to(conversation_id).emit("ai_stream", {
            message_id: aiMessageId,
            chunk: chunkText,
            conversation_id,
          });
        }

        if (!aiFullReply.trim()) {
          aiFullReply = "Xin lỗi, tôi chưa hiểu rõ yêu cầu.";
        }

        const aiMessage : any= await messageService.createMessage(
          conversation_id,
          "chatbot",
          null,
          null,
          aiFullReply
        );
        // ✅ Set cache với đúng format (content + sender_type)
        const key = `recentMessages:${conversation_id}`;
        await redisConnection.lpush(key, JSON.stringify({ 
          content: aiFullReply,
          sender_type: "chatbot" 
        }));
        await redisConnection.ltrim(key, 0, 5);
      
        this.io.to(conversation_id).emit("ai_stream_end", {
          message_id: aiMessageId,
          real_message_id: (aiMessage as any).id,
          full_content: aiFullReply,
          conversation_id,
        });
      }
      this.emitConversationUpdated(user_id, conversation_id, "ai_replied");
      console.log("AI responsed : " , aiFullReply );
    } catch (aiError: any) {
      this.io.to(conversation_id).emit("ai_error", {
        message_id: aiMessageId,
        conversation_id,
        error: "AI tạm thời không phản hồi",
        errorCode: 500,
      });
    }
  }

  private handleDisconnect(socket: Socket, user_id?: string) {
    if (!user_id) return;

    socketManager.removeUser(user_id, socket.id);

    if (!socketManager.isUserOnline(user_id)) {
      this.io.emit("user_status", { userId: user_id, status: "offline" });
    }
  }

  // Helper: Emit conversation updated to user's sockets
  private emitConversationUpdated(
    user_id: string | null | undefined,
    conversation_id: string,
    action: "message_added" | "ai_replied",
    autoRenamedTo?: string
  ) {
    if (!user_id) return;

    const userSockets = socketManager.getSockets(user_id);
    userSockets.forEach((socketId: string) => {
      this.io.to(socketId).emit("conversation_list_updated", {
        conversation_id,
        action,
        timestamp: new Date().toISOString(),
        autoRenamedTo,
      });
    });
  }

  // Helper: Send error response
  private sendError( error: string, errorCode: number,callback?: (response: ErrorResponse) => void): void {
    if (callback) {
      callback({ success: false, error, errorCode });
    }
  }
}

// Export hàm chính
export const chatSocket = (io: Server) => {
  const handler = new ChatSocketHandler(io);

  io.on("connection", (socket: Socket) => {
    handler.setupListeners(socket);
  });
};