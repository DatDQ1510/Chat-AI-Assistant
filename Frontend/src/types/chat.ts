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
  attachments?: Files[] | null; // ✅ File URLs attached to this message
  suggestions?: string[]; // ✅ AI-generated follow-up questions (3 questions)
  loadingSuggestions?: boolean; // ✅ Loading state for suggestions generation
}
export interface Files {
  url : string | null;
  type: string
}
export interface Conversation {
  id: string;
  title: string;
  user_id: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
  project_id?: string | null; // ✅ Track which project this conversation belongs to
  conversation_tag?: string | null; // ✅ Tag for categorizing conversations
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
  onSendMessage: (message: string, files?: AttachedFile[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  // ✅ NEW: For generating suggestions on the last AI message
  onGenerateSuggestions?: () => void; // Callback to generate suggestions
  lastAIMessage?: Message; // Last AI message to show button state
}

export interface MessageProps {
  message: Message;
  onCopy?: (content: string) => void;
  onRetry?: (messageId: string) => void; // ✅ Retry failed messages
  onToggleImportant?: (messageId: string, important: boolean) => void; // ✅ Toggle important status
  onSuggestionClick?: (suggestion: string) => void; // ✅ Handle suggestion button click
  // ❌ REMOVED: onGenerateSuggestions - moved to ChatInput
}

export interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: (id: string) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onUpdateTag?: (id: string, tag: string | null) => Promise<void>; // ✅ New callback for tag
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
  isActive?: boolean;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onNewChat?: (projectId: string) => void;
}