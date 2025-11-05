import { sequelize } from "../config/database.js";
import { QueryTypes } from "sequelize";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { randomUUID } from "crypto";

class MessageRepository {
  /**
   * Tạo message với embedding vector (::vector) và file attachments
   */
async createMessage(
    conversation_id: string,
    sender_type: "user" | "chatbot",
    user_id: string | null,
    chatbot_id: string | null,
    content: string,
    embedding: number[] | null,
    file_urls?: string[]
  ) {
    // ✅ Generate UUID bằng Node
    const id = randomUUID();

    // ✅ Format vector embedding
    const formattedEmbedding = embedding ? `[${embedding.join(",")}]` : null;

    // ✅ Format attachments as JSONB
    const attachments =
      file_urls && file_urls.length > 0 ? JSON.stringify(file_urls) : null;

    // ✅ Query chuẩn, có id
    const query = `
      INSERT INTO "messages" (
        "id", "conversation_id", "sender_type", "user_id", "chatbot_id",
        "content", "embedding", "attachments", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8::jsonb, NOW(), NOW())
      RETURNING *;
    `;

    const values = [
      id,                // ✅ ID sinh thủ công
      conversation_id,
      sender_type,
      user_id,
      chatbot_id,
      content,
      formattedEmbedding,
      attachments
    ];

    const [result] = await sequelize.query(query, {
      bind: values,
    });

    return result[0];
  }


  /**
   * Lấy tin nhắn của 1 conversation (phân trang)
   */
  async getMessagesByConversationId(conversation_id: string, limit: number, offset: number) {
    const dataMessages = await Message.findAll({
      where: { conversation_id: conversation_id },
      order: [["createdAt", "DESC"]], // ✅ DESC to get newest first, then reverse in service
      limit: limit,
      offset: offset,
      attributes: ["id", "sender_type", "content", "createdAt", "updatedAt", "important", "attachments"], // ✅ Add attachments
    });
    return dataMessages.reverse(); // ✅ Reverse to show oldest first in UI
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
  ) {
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    // Build query with optional conversation filter
    let query = `
      SELECT 
        m.id,
        m.content,
        m.conversation_id,
        m.sender_type AS role,
        m."createdAt" AS timestamp,
        (embedding <-> $1::vector) AS distance
      FROM "messages" m
      WHERE m.embedding IS NOT NULL
      `;
    const params: any[] = [vectorStr];

    // Add conversation filter if provided
    if (conversationId) {
      query += ` AND m.conversation_id = $${params.length + 1}`;
      params.push(conversationId);
    }

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
    return results;
  }

  /**
   * Lấy context theo dạng "latest N messages"
   */
  async getRecentMessages(conversation_id: string, limit: number): Promise<any[]> { 
    const getRecentMessages = await Message.findAll({
      where: { conversation_id: conversation_id },
      order: [["createdAt", "DESC"]],
      attributes: ["content", "sender_type"], // ✅ Thêm sender_type
      limit: limit,
      offset: 1,
    });
    const recentMessages = getRecentMessages.reverse().map(m => ({
      content: m.content,
      sender_type: m.sender_type
    }));
    console.log("Recent Messages: ", recentMessages);
    return recentMessages;
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
