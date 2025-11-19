// src/services/embedding.service.ts
import 'dotenv/config';
import openai from '../config/openai.js';

export const embeddingService = {
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!text || text.trim().length === 0) return null;

    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small', // có thể thay bằng "text-embedding-3-large" nếu cần
        input: text,
      });

      const embedding = response.data?.[0]?.embedding;
      if (!embedding) throw new Error('No embedding generated');
      return embedding;
    } catch (error: any) {
      console.error('❌ Error generating embedding:', error.message);
      return null;
    }
  },
};
