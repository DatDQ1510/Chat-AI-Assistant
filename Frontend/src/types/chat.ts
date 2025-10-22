export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
  isTemp?: boolean; // For optimistic updates before server confirmation
  status?: 'sending' | 'sent' | 'error'; // ✅ Message delivery status
  retryCount?: number; // Track retry attempts
  important?: boolean; // ✅ Mark message as important for semantic search
}

export interface Conversation {
  id: string;
  title: string;
  user_id: number;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
}

export interface ChatInputProps {
  onSendMessage: (message: string, needsSuggestions?: boolean) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export interface MessageProps {
  message: Message;
  onCopy?: (content: string) => void;
  onRetry?: (messageId: string) => void; // ✅ Retry failed messages
  onToggleImportant?: (messageId: string, important: boolean) => void; // ✅ Toggle important status
}

export interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: (id: string) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  isCompact?: boolean;
}