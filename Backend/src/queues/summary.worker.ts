import { Worker, Job } from "bullmq";
import redisConnection from "../config/redis";
import  summaryService  from "../services/summary.service"; 

export const summaryWorker = new Worker(
  "summaryQueue",
  async (job: Job) => {
    console.log("📥 Job data:", job.data);  // ✅ log đúng

    const conversationId = job.data.conversationId || job.data.conversation_id;

    if (!conversationId) {
      throw new Error("Missing conversationId in job data");
    }

    console.log(`✅ Processing summary job for conversation ${conversationId}`);

    await summaryService.generateSummary(conversationId);
  },
  { connection: redisConnection }
);

summaryWorker.on("completed", (job) => {
  console.log(`✅ Summary job completed for conversation ${job.data?.conversationId}`);
});

summaryWorker.on("failed", (job, err) => {
  console.error(`❌ Summary job failed for conversation ${job?.data?.conversationId}:`, err);
});