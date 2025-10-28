import { io, Socket } from "socket.io-client";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket || !socket.connected) {
    const token = localStorage.getItem("accessToken") || "";
    
    socket = io(baseURL, {
      auth: {
        token: token,
      },
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      // Connected
    });

    socket.on("connect_error", () => {
      // Error handled
    });

    socket.on("disconnect", () => {
      // Disconnected
    });
  }
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket();
