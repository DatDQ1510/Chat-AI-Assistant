import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.BASE_URL;
if (!apiKey ) throw new Error("❌ Missing OPENAI_API_KEY in .env file");
if (!baseURL) throw new Error("❌ Missing BASE_URL in .env file");

// ✅ Khởi tạo OpenAI client
export const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL
});
export default openai;
