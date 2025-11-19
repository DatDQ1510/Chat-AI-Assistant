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

  // CORS origins for Socket.IO
  const socketOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.DOMAIN,           // Backend domain (same origin)
    process.env.FRONTEND_URL,     // Frontend domain if separate
  ].filter(Boolean);

  io = new Server(httpServer, {
    cors: { 
      origin: socketOrigins,
      credentials: true
    },
    pingTimeout: 5000,
    pingInterval: 10000,

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
