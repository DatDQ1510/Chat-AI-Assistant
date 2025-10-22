import { sequelize } from "../config/database.js";
import { QueryTypes } from "sequelize";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";

class MessageRepository {
  /**
   * Tạo message với embedding vector (::vector)
   */
  async createMessage(
    conversation_id: string,
    sender_type: "user" | "chatbot",
    user_id: string | null,
    chatbot_id: string | null,
    content: string,
    embedding: number[] | null
  ) {
    const formattedEmbedding = embedding ? `[${embedding.join(',')}]` : null;

    const query = `
      INSERT INTO messages (conversation_id, sender_type, user_id, chatbot_id, content, embedding, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6::vector, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      conversation_id,
      sender_type,
      user_id,
      chatbot_id,
      content,
      formattedEmbedding
    ];

    const [result] = await sequelize.query(query, { bind: values });
    return result[0];
  }


  /**
   * Lấy tin nhắn của 1 conversation (phân trang)
   */
  async getMessagesByConversationId(conversation_id: string, limit: number, offset: number) {
    const dataMessages = await Message.findAll({
      where: { conversation_id: conversation_id },
      order: [["createdAt", "ASC"]], // ✅ Changed to ASC for correct chat order (oldest first)
      limit: limit,
      offset: offset,
      attributes: ["id", "sender_type", "content", "createdAt", "updatedAt", "important"],
    });
    return dataMessages;
  }

  /**
   * Đếm tổng số messages của 1 conversation
   */
  async countMessagesByConversationId(conversation_id: string) {
    const [result] = await Message.count({
      where: { conversation_id: conversation_id }
    }).then(count => [{ total: count }]);
    return parseInt((result as any).total, 10);
  }

  /**
   * Semantic Search with conversation filtering and relevance threshold
   * Two-step process:
   * 1. Filter by conversation_id (if provided)
   * 2. Apply vector search with distance threshold
   * 3. Convert distance to relevance score (1 - normalized_distance)
   */
  async searchByVector(
    queryEmbedding: any, 
    limit: number,
    conversationId?: string,
    relevanceThreshold: number = 0.3
  ) {
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    // Build query with optional conversation filter
    let query = `
      SELECT 
        m.id, 
        m.content, 
        m.conversation_id,
        m.sender_type as role,
        m.created_at as timestamp,
        (embedding <-> $1::vector) AS distance,
        (1 - (embedding <-> $1::vector)) AS relevance_score
      FROM messages m
      WHERE m.embedding IS NOT NULL
    `;

    const params: any[] = [vectorStr];

    // Add conversation filter if provided
    if (conversationId) {
      query += ` AND m.conversation_id = $${params.length + 1}`;
      params.push(conversationId);
    }

    // Add relevance threshold filter (distance should be less than threshold)
    // Note: Lower distance = higher similarity
    // Convert relevance threshold (0.3 = 30% relevant) to distance (1 - 0.3 = 0.7 max distance)
    const maxDistance = 1 - relevanceThreshold;
    query += ` AND (embedding <-> $1::vector) < ${maxDistance}`;

    // Order by distance (best matches first) and limit
    query += `
      ORDER BY embedding <-> $1::vector ASC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const results = await sequelize.query(query, {
      bind: params,
      type: QueryTypes.SELECT,
    });

    console.log(`Vector search results: ${results.length} messages found (threshold: ${relevanceThreshold})`);
    
    return results;
  }

  /**
   * Lấy context theo dạng "latest N messages"
   */
  async getRecentMessages(conversation_id: string, limit: number) { 

    const getRecentMessages = await Message.findAll({
      where: { conversation_id: conversation_id },
      order: [["createdAt", "DESC"]],
      limit: limit,
    });
    console.log("Recent messages fetched:", getRecentMessages.length);
    return getRecentMessages.reverse();
  }

  async getLastSummariedIndex(conversationId: string): Promise<number> {
    const conversation = await Conversation.findOne({
      where: { id: conversationId },
      attributes: ["lastSummariedIndex"], // chỉ lấy field cần
    });

    return conversation?.lastSummariedIndex ?? 0;
  }


  async updateConversationSummary(conversationId: string, summary: string, lastSummariedIndex: number): Promise<void> {
    await Conversation.update(
      {
        summary,
        lastSummariedIndex,
      },
      {
        where: { id: conversationId },
      }
    );
  }

  /**
   * Toggle important status for a message
   */
  async toggleImportant(message_id: string, important: boolean) {
    const updatedMessage = await Message.update(
      { important: important },
      { where: { id: message_id }, returning: true }
    );
    return updatedMessage[1][0];
  }

  async getImportantMessages(conversationId: string) {
    return await Message.findAll({
      where: { conversation_id: conversationId, important: true }
    });
  }

}

export default new MessageRepository();
