// src/repositories/memory.repository.ts
import { sequelize } from '../config/database.js';
import { randomUUID } from 'crypto';

interface CreateMemoryData {
  user_id: string;
  type?: string;
  content: string;
  embedding?: number[] | null;
  importance?: number;
}

export const memoryRepository = {
  async createMemory(data: CreateMemoryData) {
    const id = randomUUID();

    const type = data.type || 'fact';
    const importance = data.importance ?? 1;
    const formattedEmbedding = data.embedding ? `[${data.embedding.join(",")}]` : null;

    const query = `
      INSERT INTO "user_memories" 
      ("id", "user_id", "type", "content", "embedding", "importance", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5::vector, $6, NOW(), NOW())
      RETURNING *;
    `;

    const values = [
      id,
      data.user_id,
      type,
      data.content,
      formattedEmbedding,
      importance
    ];

    const [result] = await sequelize.query(query, { bind: values });
    return result[0];
  },

  async updateEmbedding(id: string, embedding: number[]) {
    const formattedEmbedding = `[${embedding.join(",")}]`;

    const query = `
      UPDATE "user_memories"
      SET embedding = $1::vector,
          "updatedAt" = NOW()
      WHERE id = $2
      RETURNING *;
    `;

    const [result] = await sequelize.query(query, { bind: [formattedEmbedding, id] });
    return result[0];
  },

  async findByUser(user_id: string, limit = 20) {
    const query = `
      SELECT * FROM "user_memories"
      WHERE user_id = $1
      ORDER BY "createdAt" DESC
      LIMIT $2;
    `;
    const [result] = await sequelize.query(query, { bind: [user_id, limit] });
    return result;
  },

  async findByType(user_id: string, type: string) {
    const query = `
      SELECT * FROM "user_memories"
      WHERE user_id = $1 AND type = $2
      ORDER BY "createdAt" DESC;
    `;
    const [result] = await sequelize.query(query, { bind: [user_id, type] });
    return result;
  },

  async findRecentFacts(user_id: string, limit = 5) {
    const query = `
      SELECT * FROM "user_memories"
      WHERE user_id = $1 AND type = 'fact'
      ORDER BY "createdAt" DESC
      LIMIT $2;
    `;
    const [result] = await sequelize.query(query, { bind: [user_id, limit] });
    return result;
  },
};
