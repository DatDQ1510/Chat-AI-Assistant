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
   * Semantic Search theo vector embedding
   */
  async searchByVector(queryEmbedding: any, limit: number) {
    const vectorStr = `[${queryEmbedding.join(',')}]`; // ✅ convert mảng sang chuỗi vector hợp lệ

    const results = await sequelize.query(
      `
      SELECT id, content, conversation_id, 
            embedding <-> $1::vector AS distance
      FROM messages
      WHERE embedding IS NOT NULL
      ORDER BY embedding <-> $1::vector ASC
      LIMIT $2
      `,
      {
        bind: [vectorStr, limit],
        type: QueryTypes.SELECT,
      }
    );
    console.log("Vector search results in repository:", results);
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
