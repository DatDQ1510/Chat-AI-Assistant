// socket.manager.ts - Manage user online status and socket connections
const onlineUsers: Record<string, Set<string>> = {};

export const socketManager = {
  /**
   * Add a user's socket connection
   * @param userId - User identifier
   * @param socketId - Socket connection ID
   */
  addUser(userId: string, socketId: string): void {
    if (!onlineUsers[userId]) {
      onlineUsers[userId] = new Set();
    }
    onlineUsers[userId].add(socketId);
    console.log(`📌 Added socket ${socketId} for user ${userId}`);
  },

  /**
   * Remove a user's socket connection
   * @param userId - User identifier
   * @param socketId - Socket connection ID
   */
  removeUser(userId: string, socketId: string): void {
    if (!onlineUsers[userId]) return;
    
    onlineUsers[userId].delete(socketId);
    console.log(`📌 Removed socket ${socketId} for user ${userId}`);
    
    // Clean up if no more connections
    if (onlineUsers[userId].size === 0) {
      delete onlineUsers[userId];
      console.log(`📌 User ${userId} has no more connections`);
    }
  },

  /**
   * Check if a user is currently online
   * @param userId - User identifier
   * @returns True if user has at least one active connection
   */
  isUserOnline(userId: string): boolean {
    return Boolean(onlineUsers[userId] && onlineUsers[userId].size > 0);
  },

  /**
   * Get all socket IDs for a user
   * @param userId - User identifier
   * @returns Array of socket IDs
   */
  getSockets(userId: string): string[] {
    return onlineUsers[userId] ? Array.from(onlineUsers[userId]) : [];
  },

  /**
   * Get total number of online users
   * @returns Count of users with active connections
   */
  getOnlineUserCount(): number {
    return Object.keys(onlineUsers).length;
  },

  /**
   * Get all online user IDs
   * @returns Array of user IDs
   */
  getOnlineUsers(): string[] {
    return Object.keys(onlineUsers);
  }
};
