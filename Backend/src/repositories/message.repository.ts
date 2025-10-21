import { sequelize } from "../config/database.js";
import { QueryTypes } from "sequelize";
import { Conversation } from "../models/conversation.model.js";

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
    const [rows] = await sequelize.query(
      `SELECT id, sender_type, content, created_at, updated_at
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2
       OFFSET $3
       `,
      { bind: [conversation_id, limit, offset] }
    );
    console.log("Fetched messages:", rows);
    return rows;
  }

  /**
   * Đếm tổng số messages của 1 conversation
   */
  async countMessagesByConversationId(conversation_id: string) {
    const [result] = await sequelize.query(
      `SELECT COUNT(*) as total
       FROM messages
       WHERE conversation_id = $1
       `,
      { bind: [conversation_id] }
    );
    return parseInt((result[0] as any).total, 10);
  }

  /**
   * Xóa mềm message (nếu muốn xóa cứng thì thay DELETE)
   */
  async deleteMessage(message_id: string) {
    await sequelize.query(
      `
      DELETE FROM messages WHERE id = $1
      `,
      { bind: [message_id] }
    );
    return { success: true };
  }

  /**
   * Update lại message + embedding
   */
  async updateMessage(message_id: string, newContent: string, newEmbedding: number[] | null) {
    const formattedEmbedding = newEmbedding ? `[${newEmbedding.join(',')}]` : null;
    const query = newEmbedding
      ? `
        UPDATE messages
        SET content = $2,
            embedding = $3::vector,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `
      : `
        UPDATE messages
        SET content = $2,
            embedding = NULL,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `;

    const bindValues = formattedEmbedding
      ? [message_id, newContent, formattedEmbedding]
      : [message_id, newContent];

    const [result] = await sequelize.query(query, { bind: bindValues });
    return result;
  }


  /**
   * Semantic Search theo vector embedding
   */
  async searchByVector(conversation_id: string, queryEmbedding: number[], limit: number) {
    const [results] = await sequelize.query(
      `
      SELECT id, content, embedding,
             embedding <-> $2::vector AS distance
      FROM messages
      WHERE conversation_id = $1
      ORDER BY embedding <-> $2::vector ASC
      LIMIT $3
      `,
      { bind: [conversation_id, queryEmbedding, limit] }
    );
    return results;
  }

  /**
   * Lấy context theo dạng "latest N messages"
   */
  async getRecentMessages(conversation_id: string, limit: number) {
    const [results] = await sequelize.query(
      `
      SELECT id, sender_type, content 
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      {
        bind: [conversation_id, limit],
      }
    );
    if (!results) return [];
    return results.reverse(); 
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

  async countMessages(): Promise<number> {
    const [results] = await sequelize.query(
      `
      SELECT COUNT(*) as total
      FROM messages
      `
    );
    return parseInt((results as any)[0]?.total || '0', 10);
  }


}

export default new MessageRepository();
