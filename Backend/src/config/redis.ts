import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();
console.log("Redis Host:", process.env.REDIS_HOST);
console.log("Redis Port:", process.env.REDIS_PORT);
const redisConnection = new Redis({
  host: process.env.REDIS_HOST,  // từ env, ví dụ red-d4eke8fpm1nc738t3sj0
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined, // nếu Render yêu cầu
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => console.log("✅ Redis connected"));
redisConnection.on("error", (err) => console.error("❌ Redis error:", err));

export default redisConnection;
