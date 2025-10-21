import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";

import { authenticate } from "./middlewares/auth.middleware.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import openAI  from "./config/openai.js";
dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());

// ✅ Endpoint sinh phản hồi từ AI
app.post("/v1/api/genai", async (req, res) => {
  try {
    const { messages } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const response = await openAI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages
    });

    res.json(response);
  } catch (error) {
    console.error("Error generating AI response:", (error as Error).message);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});



// Public routes
app.use("/v1/api/auth", authRoutes);

// Protected routes
app.use(authenticate);
app.use("/v1/api/users", userRoutes);
app.use("/v1/api/conversations", conversationRoutes);
app.use("/v1/api/messages", messageRoutes);

app.use(errorHandler);

export default app;
