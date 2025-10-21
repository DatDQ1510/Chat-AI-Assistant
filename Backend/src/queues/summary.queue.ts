import { Queue, Worker, Job } from "bullmq";
import redisConnection from "../config/redis";

export const summaryQueue = new Queue("summaryQueue", {
    connection: redisConnection,

    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: true
    },
    
});

