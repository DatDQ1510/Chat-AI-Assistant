import { Worker, Job } from "bullmq";
import redisConnection from "../config/redis";
import  summaryService  from "../services/summary.service"; 

export const summaryWorker = new Worker(
  "summaryQueue",
  async (job: Job) => {

    const conversationId = job.data.conversationId || job.data.conversation_id;

    if (!conversationId) {
      throw new Error("Missing conversationId in job data");
    }

    await summaryService.generateSummary(conversationId);
  },
  { connection: redisConnection }
);

summaryWorker.on("completed", (job) => {

});

summaryWorker.on("failed", (job, err) => {

});