// utils/chat.ts
import type { Message } from '../types/chat';

interface RawMessage {
  id: string;
  sender_type: string;
  content: string;
  updated_at?: string;
  updatedAt?: string;
  created_at?: string;
  createdAt?: string;
}

export const formatMessage = (msg: RawMessage): Message => ({
  id: msg.id,
  role: msg.sender_type === "user" ? "user" : "assistant",
  content: msg.content || "",
  timestamp: new Date(msg.updated_at || msg.updatedAt || msg.created_at || msg.createdAt || new Date()),
});
