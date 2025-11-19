import { Worker, Job } from "bullmq";
import redisConnection from "../config/redis";
import { embeddingService } from "../services/embedding.service";
import { memoryRepository } from "../repositories/memory.repository";

export const memoryWorker = new Worker(
  "memoryQueue",
  async (job) => {
    const { memoryId, content } = job.data;
    console.log(`🧠 Processing memory embedding for ID=${memoryId}`);
    console.log(`Content: ${content}`);
    const embedding = await embeddingService.generateEmbedding(content);
    if (!embedding) {
      console.warn(`⚠️ Skipped memory ${memoryId}: embedding generation failed.`);
      return;
    }

    await memoryRepository.updateEmbedding(memoryId, embedding);
    console.log(`✅ Memory embedding updated for ID=${memoryId}`);
  },
  { connection: redisConnection }
);

memoryWorker.on("completed", (job) => {
  console.log(`Memory embedding processed for ID=${job.data.memoryId}`);
});

memoryWorker.on("failed", (job, err) => {
  console.error(`Failed to generate memory embedding for ID=${(job as any).data.memoryId}`, err);
});