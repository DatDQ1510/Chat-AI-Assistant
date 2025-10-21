// src/workers/message.worker.ts
import { Worker, Job } from "bullmq";
import redisConnection from "../config/redis";
import { getIO } from "../sockets/socket.server";
import { socketManager } from "../sockets/socket.manager"; 

export const messageWorker = new Worker(
  "messageQueue",
  async (job: Job) => {
    const { conversationId, message, targetUserId } = job.data;

    if (!conversationId || !message || !targetUserId) {
      throw new Error("❌ Missing data in job");
    }

    console.log(`🔁 Retry send message ${message.id} to user ${targetUserId}`);

    // ✅ Nếu user còn offline -> throw để BullMQ retry
    if (!socketManager.isUserOnline(targetUserId)) {
      console.log(`⚠️ User ${targetUserId} offline, retry later`);
      throw new Error("User still offline");
    }

    // ✅ User online -> gửi message qua socket
    const io = getIO();
    io.to(conversationId).emit("receive_message", message);

    console.log(`✅ Message ${message.id} delivered to ${targetUserId}`);
    return true;
  },
  {
    connection: redisConnection,
  }
);
