import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";
import uploadRoutes from "./routes/upload.route.js";
import { authenticate } from "./middlewares/auth.middleware.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import projectRoutes from "./routes/project.routes.js";
dotenv.config();

const app = express();

app.use(express.json());

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:80',
  'http://localhost',
  'https://chat-ai-assistant.onrender.com',  // Frontend domain
  'https://chat-ai-backend.onrender.com',     // Backend domain (same-origin)
  process.env.DOMAIN,
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin)); // Type guard

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS allowed: ${origin}`);
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS origin not in whitelist: ${origin}`);
        // Allow in production for now
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  })
);

app.use(cookieParser());

// Health check endpoint (before auth)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/v1/api/upload", uploadRoutes);
// Public routes
app.use("/v1/api/auth", authRoutes);

// Protected routes
app.use(authenticate);

app.use("/v1/api/projects", projectRoutes);
app.use("/v1/api/users", userRoutes);
app.use("/v1/api/conversations", conversationRoutes);
app.use("/v1/api/messages", messageRoutes);

app.use(errorHandler);

export default app;
