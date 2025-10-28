import dotenv from "dotenv";
import Redis from "ioredis/built/Redis";

dotenv.config();
const redisConnection = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null
});
redisConnection.on("connect", () => console.log("✅ Redis connected"));
redisConnection.on("error", (err) => console.error("❌ Redis error:", err));


export default redisConnection;
