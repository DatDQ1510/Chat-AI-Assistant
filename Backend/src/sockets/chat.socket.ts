import { Server, Socket } from "socket.io";
import messageService from "../services/message.service.js";
import { generatorService } from "../services/generator.service.js";
import contextService from "../services/context.service.js";
import { socketManager } from "./socket.manager.js";
import readPdfFromUrl from "../utils/readPdf.js";

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
  content: string;
  needs_suggestions?: boolean;
  file_urls?: string[]; // Support file URLs
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

  private async handleSendMessage(
    socket: Socket,
    payload: SendMessagePayload,
    callback?: (response: ErrorResponse) => void
  ) {
    const { conversation_id, content, needs_suggestions = false, file_urls } = payload;
    const user_id = (socket as any).user?.id;

    try {
      // Validation
      if (!conversation_id || !content?.trim()) {
        return this.sendError(callback, "Invalid conversation_id or empty content", 400);
      }

      // Xử lý file (nếu có)
      let text_file_urls = "";
      if (file_urls && file_urls.length > 0) {
        text_file_urls = await readPdfFromUrl(file_urls[0]); // TODO: Handle multiple files if needed
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
      await this.handleAIResponse(conversation_id, content, user_id, needs_suggestions, text_file_urls, aiMessageId);
    } catch (err: any) {
      this.sendError(callback, err.message ?? "Internal server error", 500);
    }
  }

  private async handleAIResponse(
    conversation_id: string,
    content: string,
    user_id: string | null | undefined,
    needs_suggestions: boolean,
    text_file_urls: string,
    aiMessageId: string
    ) {
    try {
      const context = await contextService.buildPrompt(
        conversation_id,
        content,
        user_id,
        needs_suggestions,
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
        // === CÁCH MỚI: GỌI FULL RESPONSE + JSON ===
        const fullResponse = await generatorService.getFullJsonResponse(
          context.systemPrompt,
          context.userPrompt
        );
        console.log("Full AI response (JSON):", fullResponse);
        aiFullReply = fullResponse.answer || "Không có phản hồi.";
        suggestions = fullResponse.suggestions || [];
        console.log("Parsed AI answer and suggestions:", aiFullReply, suggestions);
        // Fake streaming: chia nhỏ answer
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
      } else {
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
      }

      // Lưu tin nhắn AI
      const aiMessage = await messageService.createMessage(
        conversation_id,
        "chatbot",
        null,
        null,
        aiFullReply
      );

      // Gửi kết thúc + gợi ý (nếu có)
      this.io.to(conversation_id).emit("ai_stream_end", {
        message_id: aiMessageId,
        real_message_id: (aiMessage as any).id,
        full_content: aiFullReply,
        conversation_id,
        suggestions: needs_suggestions ? suggestions : undefined,
      });

      this.emitConversationUpdated(user_id, conversation_id, "ai_replied");
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
  private sendError(callback?: (response: ErrorResponse) => void, error: string, errorCode: number): void {
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