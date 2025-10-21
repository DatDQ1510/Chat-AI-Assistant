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
    console.warn("⚠️ Socket server already initialized, returning existing instance");
    return io;
  }

  io = new Server(httpServer, {
    cors: { 
      origin: ["http://localhost:5173", "http://localhost:5174"],
      credentials: true
    },
    pingTimeout: 10000,
    pingInterval: 25000,

  });

  console.log("✅ Socket.IO server created");
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
