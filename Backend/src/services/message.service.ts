import messageRepository from "../repositories/message.repository";
import { embeddingService } from "./embedding.service";
// import { embeddingService } from "./embedding.service";
import conversationService from "./conversation.service";
import { summaryQueue } from "../queues/summary.queue";
export class MessageService {
  /**
   * Create a message (user or chatbot)
   */
  async createMessage(
    conversation_id: string,
    sender_type: "user" | "chatbot",
    user_id: string | null,
    chatbot_id: string | null,
    content: string,
  ) {

    const count = await messageRepository.countMessagesByConversationId(conversation_id);

    if (count > 0  && count % 10 === 0) {
       await summaryQueue.add("auto-summary", { conversationId: conversation_id });
        console.log(`🧩 Added conversation ${conversation_id} to summary queue`);
    }

    const embedding = await embeddingService.generateEmbedding(content).catch((error) => {
      console.error("⚠️ Embedding failed, set null", error);
      return null;
    });


    return messageRepository.createMessage(
      conversation_id,
      sender_type,
      user_id,
      chatbot_id,
      content,
      embedding || null
    );
  }

  /**
   * Get paginated messages by conversation
   */
  async getMessagesByConversationId(
    conversation_id: string,
    limit = 20,
    page = 1
  ) {
    const offset = (page - 1) * limit;
    
    // Get messages and total count in parallel
    const [messages, total] = await Promise.all([
      messageRepository.getMessagesByConversationId(conversation_id, limit, offset),
      messageRepository.countMessagesByConversationId(conversation_id)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Handle chatbot reply message
   */
  async handleReply(
    conversation_id: string,  
    chatbot_id: string | null,
    content: string
  ) {
    return this.createMessage(
      conversation_id, 
      "chatbot",
      null,
      chatbot_id || "1", 
      content
    );
  }
  async updateMessageContent(message_id: string, newContent: string) {
    let embedding = null;
    try {
      embedding = await embeddingService.generateEmbedding(newContent);
    } catch (error) {
      console.error("⚠️ Embedding failed, set null", error);
    }

    return messageRepository.updateMessage(message_id, newContent, embedding || null);
  }

  /**
   * Toggle important status for a message
   */
  async toggleImportant(message_id: string, important: boolean) {
    return messageRepository.toggleImportant(message_id, important);
  }
  
  
}

export default new MessageService();
