import { Queue, Worker, Job } from "bullmq";
import redisConnection from "../config/redis";

export interface FailedMessagePayload {
  messageId: string;
  conversationId: string;
  message: any;
  reason: string;
} 

export const messageQueue = new Queue("messageQueue", {
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

export async function  addToFailedMessageQueue(payload: FailedMessagePayload) {
  await messageQueue.add("failed-message", payload, {
    attempts: 5,          // BullMQ sẽ retry job thêm 5 lần nữa
    backoff: {
      type: "exponential",
      delay: 2000,        // retry sau mỗi 2s tăng dần
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
  console.log(`➕ Message ${payload.messageId} added to failed message queue`);
}