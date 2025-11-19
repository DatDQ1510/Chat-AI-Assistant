// socket.server.ts - Singleton Socket.IO server
import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: Server | null = null;

/**
 * Create and configure Socket.IO server
 * @param httpServer - HTTP server instance
 * @returns Configured Socket.IO server
 */
export const createSocketServer = (httpServer: HTTPServer): Server => {
  if (io) {

    return io;
  }

  // CORS origins for Socket.IO - hardcoded production domains
  const socketOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://chat-ai-assistant.onrender.com',  // Frontend domain
    'https://chat-ai-backend.onrender.com',     // Backend domain
    process.env.DOMAIN,
    process.env.FRONTEND_URL,
  ].filter((origin): origin is string => typeof origin === 'string' && origin.length > 0);

  console.log('🔌 Socket.IO CORS origins:', socketOrigins);

  io = new Server(httpServer, {
    cors: { 
      origin: socketOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 5000,
    pingInterval: 10000,
    transports: ['websocket', 'polling'], // Enable both for better compatibility
  });
  return io;
};

/**
 * Get existing Socket.IO server instance
 * @throws Error if server not initialized
 * @returns Socket.IO server instance
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error("❌ Socket server not initialized! Call createSocketServer first.");
  }
  return io;
};
