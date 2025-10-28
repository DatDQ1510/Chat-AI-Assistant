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
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
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
