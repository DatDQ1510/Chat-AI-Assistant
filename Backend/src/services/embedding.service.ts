import "dotenv/config";
import openai from "../config/openai.js";


async function generateEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small", // hoặc "text-embedding-3-large"
      input: text,
    });     
    if (!response.data[0].embedding) throw new Error("No embedding found");
    return response.data[0].embedding;
  } catch (error: any) {
    console.error("Embedding Error:", error.response?.data || error.message);
  }
}
export const embeddingService = { generateEmbedding };
