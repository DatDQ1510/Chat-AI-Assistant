// utils/chat.ts
import type { Message } from '../types/chat';

interface RawMessage {
  id: string;
  sender_type: string;
  content: string;
  updatedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  createdAt?: string;
}

export const formatMessage = (msg: RawMessage): Message => ({
  id: msg.id,
  role: msg.sender_type === "user" ? "user" : "assistant",
  content: msg.content || "",
  timestamp: new Date(msg.updatedAt || msg.updatedAt || msg.createdAt || msg.createdAt || new Date()),
});
