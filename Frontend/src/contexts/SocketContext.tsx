import React, { createContext, useContext, useEffect, useState } from "react";
import { getSocket, disconnectSocket } from "../config/socket";
import { Socket } from "socket.io-client";

type SocketContextType = Socket | null;

const SocketContext = createContext<SocketContextType>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Get socket instance with current token
    const socketInstance = getSocket();
    setSocket(socketInstance);

    console.log("✅ Socket instance created");

    socketInstance.on("connect", () => {
      console.log("🟢 WebSocket connected:", socketInstance.id);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("� WebSocket connection error:", error.message);
      // Retry with fresh token
      const token = localStorage.getItem("accessToken");
      if (token && socketInstance.auth) {
        socketInstance.auth = { token };
        socketInstance.connect();
      }
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔴 WebSocket disconnected:", reason);
    });

    // Cleanup when unmount
    return () => {
      disconnectSocket();
      console.log("🔌 WebSocket cleanup disconnect");
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook to use socket in components
// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  const ctx = useContext(SocketContext);
  return ctx;
};
