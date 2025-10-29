import { Worker, Job } from "bullmq";
import redisConnection from "../config/redis";
import  summaryService  from "../services/summary.service"; 

export const summaryWorker = new Worker(
  "summaryQueue",
  async (job: Job) => {
    console.log(`Processing summary for conversationId: ${job.data.conversationId}`);
    const conversationId = job.data.conversationId || job.data.conversation_id;

    if (!conversationId) {
      throw new Error("Missing conversationId in job data");
    }

    await summaryService.generateSummary(conversationId);
  },
  { connection: redisConnection }
);

summaryWorker.on("completed", (job) => {
  console.log(`Summary generated for conversationId: ${job.data.conversationId}`);
});

summaryWorker.on("failed", (job, err) => {
  console.error(`Failed to generate summary for conversationId: ${(job as any).data.conversationId}`, err);
});