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
  attachments?: string[]; // ✅ File URLs attached to this message
}

export interface Conversation {
  id: string;
  title: string;
  user_id: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
  project_id?: string | null; // ✅ Track which project this conversation belongs to
}

export interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
}

export interface AttachedFile {
  uid: string;
  name: string;
  type: string;
  file: File;
  preview?: string;
  url?: string; // ✅ Cloudinary URL after upload
  uploading?: boolean; // ✅ Upload in progress
  uploadError?: string; // ✅ Upload error message
}

export interface ChatInputProps {
  onSendMessage: (message: string, needsSuggestions?: boolean, files?: AttachedFile[]) => void;
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

// ✅ Project types
export interface Project {
  id: string;
  project_name: string;
  description?: string;
  user_id: string;
  createdAt: Date;
  updatedAt: Date;
  conversations?: Conversation[];
}

export interface ProjectItemProps {
  project: Project;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onConversationClick?: (conversationId: string) => void;
  currentConversationId?: string | null;
}