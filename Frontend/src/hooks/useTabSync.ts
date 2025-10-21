import { useEffect } from 'react';
import { chatChannel, type TabSyncEvent } from '../utils/tabSync';
import type { Message, ChatState } from '../types/chat';

interface UseTabSyncProps {
  setMessagesMap: React.Dispatch<React.SetStateAction<{ [conversationId: string]: Message[] }>>;
  setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
  setIsWaitingForAI: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useTabSync = ({
  setMessagesMap,
  setChatState,
  setIsWaitingForAI,
}: UseTabSyncProps) => {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const { type, payload } = event.data as TabSyncEvent;
      
      switch (type) {
        case 'new_message':
          setMessagesMap(prev => {
            const messages = prev[payload.conversationId] || [];
            const exists = messages.some(m => m.id === payload.message.id);
            if (exists) return prev;
            
            return {
              ...prev,
              [payload.conversationId]: [...messages, payload.message],
            };
          });
          break;

        case 'update_message':
          setMessagesMap(prev => ({
            ...prev,
            [payload.conversationId]: (prev[payload.conversationId] || []).map(m =>
              m.id === payload.messageId ? { ...m, ...payload.updates } : m
            ),
          }));
          break;

        case 'ai_message_init':
          setMessagesMap(prev => {
            const messages = prev[payload.conversationId] || [];
            const exists = messages.some(m => m.id === payload.message.id);
            if (exists) return prev;
            
            return {
              ...prev,
              [payload.conversationId]: [...messages, payload.message],
            };
          });
          break;

        case 'ai_stream_chunk':
          setMessagesMap(prev => ({
            ...prev,
            [payload.conversationId]: (prev[payload.conversationId] || []).map(m =>
              m.id === payload.messageId 
                ? { ...m, content: (m.content || "") + payload.chunk } 
                : m
            ),
          }));
          break;

        case 'ai_stream_end':
          setMessagesMap(prev => ({
            ...prev,
            [payload.conversationId]: (prev[payload.conversationId] || []).map(m =>
              m.id === payload.messageId
                ? { 
                    ...m, 
                    id: payload.realMessageId,
                    content: payload.fullContent,
                    isStreaming: false,
                    status: 'sent' as const,
                    isTemp: false
                  }
                : m
            ),
          }));
          break;

        case 'ai_error':
          setMessagesMap(prev => ({
            ...prev,
            [payload.conversationId]: (prev[payload.conversationId] || []).map(m =>
              m.id === payload.messageId
                ? { 
                    ...m, 
                    content: `⚠️ ${payload.error}`,
                    isStreaming: false,
                    status: 'error' as const
                  }
                : m
            ),
          }));
          break;

        case 'new_conversation':
          setChatState(prev => {
            const exists = prev.conversations.some(c => c.id === payload.conversation.id);
            if (exists) return prev;
            
            return {
              ...prev,
              conversations: [payload.conversation, ...prev.conversations],
            };
          });
          break;

        case 'delete_conversation':
          setChatState(prev => ({
            ...prev,
            conversations: prev.conversations.filter(c => c.id !== payload.conversationId),
            currentConversationId: prev.currentConversationId === payload.conversationId 
              ? null 
              : prev.currentConversationId,
          }));
          setMessagesMap(prev => {
            const updated = { ...prev };
            delete updated[payload.conversationId];
            return updated;
          });
          break;

        case 'rename_conversation':
          setChatState(prev => ({
            ...prev,
            conversations: prev.conversations.map(c =>
              c.id === payload.conversationId 
                ? { ...c, title: payload.newTitle, updatedAt: new Date() }
                : c
            ),
          }));
          break;

        case 'streaming_status':
          setChatState(prev => ({ ...prev, isStreaming: payload.isStreaming }));
          setIsWaitingForAI(payload.isWaitingForAI);
          break;

        default:
          break;
      }
    };

    chatChannel.addEventListener('message', handler);
    return () => chatChannel.removeEventListener('message', handler);
  }, [setMessagesMap, setChatState, setIsWaitingForAI]);
};
