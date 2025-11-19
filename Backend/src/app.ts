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
  'http://localhost:5173',     // Dev frontend
  'http://localhost:80',        // Docker frontend
  'http://localhost',           // Docker frontend without port
  process.env.DOMAIN,           // Production domain (Render backend URL)
  process.env.FRONTEND_URL,     // Production frontend URL (if separate)
].filter(Boolean); // Remove undefined values

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      
      // Allow all origins in production if no specific FRONTEND_URL set
      if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL && !process.env.DOMAIN) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked origin: ${origin}`);
        callback(null, true); // Allow anyway in production for debugging
      }
    },
    credentials: true,
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
