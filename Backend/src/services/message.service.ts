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
    file_urls?: string[] // ✅ Add file_urls parameter
  ): Promise<{ message: any; autoRenamedTo?: string }> {

    const count = await messageRepository.countMessagesByConversationId(conversation_id);

    if (count > 0  && count % 10 === 0) {
       await summaryQueue.add("auto-summary", { conversationId: conversation_id });
    }

    const embedding = await embeddingService.generateEmbedding(content).catch((error) => {

      return null;
    });

    // ✅ Create message
    const message = await messageRepository.createMessage(
      conversation_id,
      sender_type,
      user_id,
      chatbot_id,
      content,
      embedding || null,
      file_urls // ✅ Pass file_urls to repository
    );

    // ✅ Auto-rename conversation if this is the first user message
    let autoRenamedTo: string | null | undefined = null;
    if (count === 0 && sender_type === "user") {
      autoRenamedTo = await this.autoRenameConversation(conversation_id, content);
    }

    // ✅ Touch conversation to update updatedAt timestamp
    await this.touchConversation(conversation_id);

    return { 
      message, 
      autoRenamedTo: autoRenamedTo || undefined 
    };
  }

  /**
   * Auto-rename conversation based on first user message
   */
  private async autoRenameConversation(conversation_id: string, content: string) {
    try {
      const conversation = await conversationService.getConversationById(conversation_id);
      
      if (!conversation) return;

      // Check if conversation still has default name
      const isDefaultName = conversation.conversation_name === 'New Chat' || 
                           conversation.conversation_name.startsWith('New Chat');
      
      if (!isDefaultName) return; // User already renamed, don't override

      // Generate new name from first message
      let newName = content.trim();
      
      // Truncate if too long
      if (newName.length > 50) {
        newName = newName.substring(0, 50) + '...';
      }
      
      // Remove newlines
      newName = newName.replace(/\n/g, ' ');
      
      // Update conversation name
      await conversationService.updateConversation(conversation_id, newName);

      
      return newName; // ✅ Return new name to emit via socket
      
    } catch (error) {

      // Non-critical, don't throw
      return null;
    }
  }

  /**
   * Touch conversation to update its updatedAt timestamp
   */
  private async touchConversation(conversation_id: string) {
    try {
      const success = await conversationService.touchConversation(conversation_id);
      
      if (success) {
      } else {

      }
    } catch (error) {

      // Non-critical, don't throw - conversation will still work, just won't reorder
    }
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

    // ✅ Map messages to include file_urls from attachments field
    const mappedMessages = messages.map((msg: any) => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_type: msg.sender_type,
      content: msg.content,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      important: msg.important,
      file_urls: msg.attachments || [], // ✅ Map attachments to file_urls
    }));

    return {
      messages: mappedMessages,
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


  /**
   * Toggle important status for a message
   */
  async toggleImportant(message_id: string, important: boolean) {
    return messageRepository.toggleImportant(message_id, important);
  }
  
  async getImportantMessages(conversationId: string) {
    return messageRepository.getImportantMessages(conversationId);
  }

  /**
   * Semantic search within a specific conversation
   * Two-step process:
   * 1. Fetch all messages from the conversation
   * 2. Apply vector search only on those messages
   * 3. Filter by relevance threshold
   */
  async searchByVectorEmbedding(
    query: string,
    limit: number = 5,
    conversationId?: string,
    relevanceThreshold: number = 0.5 // Minimum relevance score (0-1 scale, lower distance = higher relevance)
  ) {
    
    // 1️⃣ Create embedding for the query
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    // 2️⃣ Call repository to search (with conversation filter if provided)
    const results = await messageRepository.searchByVector(
      queryEmbedding,
      limit,
      conversationId,
      relevanceThreshold
    );

    // 3️⃣ Return results (empty array if no matches above threshold)
    return results;
  }

}

export default new MessageService();
