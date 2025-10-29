// ✅ Enhanced BroadcastChannel for comprehensive tab sync
export const chatChannel = new BroadcastChannel('chat_sync');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMessage = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConversation = any;

export type TabSyncEvent = 
  | { type: 'new_message'; payload: { conversationId: string; message: AnyMessage } }
  | { type: 'update_message'; payload: { conversationId: string; messageId: string; updates: Partial<AnyMessage> } }
  | { type: 'ai_message_init'; payload: { conversationId: string; message: AnyMessage } }
  | { type: 'ai_stream_chunk'; payload: { conversationId: string; messageId: string; chunk: string } }
  | { type: 'ai_stream_end'; payload: { conversationId: string; messageId: string; realMessageId: string; fullContent: string; suggestions?: string[] } }
  | { type: 'ai_error'; payload: { conversationId: string; messageId: string; error: string } }
  | { type: 'new_conversation'; payload: { conversation: AnyConversation } }
  | { type: 'delete_conversation'; payload: { conversationId: string } }
  | { type: 'rename_conversation'; payload: { conversationId: string; newTitle: string } }
  | { type: 'streaming_status'; payload: { isStreaming: boolean; isWaitingForAI: boolean } }
  | { type: 'toggle_important'; payload: { conversationId: string; messageId: string; important: boolean } }
  | { type: 'refresh_conversations'; payload: Record<string, never> }; // ✅ Simple refresh trigger

// ✅ Helper to broadcast events to other tabs
export const broadcastToTabs = (event: TabSyncEvent) => {
  try {
    chatChannel.postMessage(event);
  } catch {
    // BroadcastChannel not supported or failed
  }
};
