import { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';
import { Socket } from 'socket.io-client';
import messageService from '../services/message.service';
import type { Message } from '../types/chat';

interface UseMessagesProps {
  currentConversationId: string | null;
  // conversations: Conversation[]; // ✅ No longer needed
  isLoading: boolean;
  userId: string | null;
  socket: Socket | null;
  messagesMap: { [conversationId: string]: Message[] };
  setMessagesMap: React.Dispatch<React.SetStateAction<{ [conversationId: string]: Message[] }>>;
}

export const useMessages = ({
  currentConversationId,
  // conversations, // ✅ No longer needed
  isLoading,
  userId,
  socket,
  messagesMap,
  setMessagesMap,
}: UseMessagesProps) => {
  // ✅ Use shared messagesMap from parent instead of creating own state

  const [messagePagination, setMessagePagination] = useState<{
    [conversationId: string]: {
      currentPage: number;
      totalPages: number;
      isLoading: boolean;
      hasMore: boolean;
    };
  }>({});

  const loadedConversationsRef = useRef<Set<string>>(new Set());
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);

  // Load messages for current conversation
  useEffect(() => {
    const loadMessagesForCurrentConversation = async () => {
      if (!currentConversationId) return;
      
      if (isLoading) {
        return;
      }
      
      // ✅ Remove check for conversation existence
      // Project conversations may not be in the conversations list
      // const conv = conversations.find(c => c.id === currentConversationId);
      // if (!conv) {
      //   return;
      // }
      
      if (loadedConversationsRef.current.has(currentConversationId)) {
        return;
      }
      
      loadedConversationsRef.current.add(currentConversationId);
      
      try {        
        const { messages, pagination } = await messageService.getMessagesByConversation(
          currentConversationId,
          { page: 1, limit: 5 }
        );
                
        const sortedMessages = [...messages].sort((a, b) => 
          a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        setMessagesMap(prev => ({
          ...prev,
          [currentConversationId]: sortedMessages
        }));

        const paginationState = {
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          isLoading: false,
          hasMore: pagination.page < pagination.totalPages,
        };
        
        setMessagePagination(prev => ({   
          ...prev,
          [currentConversationId]: paginationState,
        }));
      } catch (err) {
        console.error('Failed to load messages for conversation:', err);
        setMessagePagination(prev => ({
          ...prev,
          [currentConversationId]: {
            currentPage: 1,
            totalPages: 1,
            isLoading: false,
            hasMore: false,
          }
        }));
      }
    };

    loadMessagesForCurrentConversation();
  }, [currentConversationId, isLoading, setMessagesMap]);

  // Load more messages
  const handleLoadMoreMessages = useCallback(async () => {
    if (!currentConversationId) return;
    
    const pagination = messagePagination[currentConversationId];
    if (!pagination || pagination.isLoading || !pagination.hasMore) return;

    try {
      const nextPage = pagination.currentPage + 1;
      
      setMessagePagination(prev => ({
        ...prev,
        [currentConversationId]: {
          ...prev[currentConversationId],
          isLoading: true,
        }
      }));

      const { messages: olderMessages, pagination: newPagination } = await messageService.getMessagesByConversation(
        currentConversationId,
        { page: nextPage, limit: 5 }
      );

      const sortedOlderMessages = [...olderMessages].sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );

      setMessagesMap(prev => ({
        ...prev,
        [currentConversationId]: [
          ...sortedOlderMessages,
          ...(prev[currentConversationId] || [])
        ]
      }));

      setMessagePagination(prev => ({
        ...prev,
        [currentConversationId]: {
          currentPage: newPagination.page,
          totalPages: newPagination.totalPages,
          isLoading: false,
          hasMore: newPagination.page < newPagination.totalPages,
        }
      }));

    } catch (err) {
      console.error('Failed to load more messages:', err);
      setMessagePagination(prev => ({
        ...prev,
        [currentConversationId]: {
          ...prev[currentConversationId],
          isLoading: false,
        }
      }));
    }
  }, [currentConversationId, messagePagination, setMessagesMap]);

  // Retry failed message
  const handleRetryMessage = useCallback(async (messageId: string) => {
    if (!socket || !currentConversationId) return;

    const conversationId = currentConversationId;
    const failedMessage = messagesMap[conversationId]?.find(m => m.id === messageId);

    if (!failedMessage || failedMessage.status !== 'error') return;

    if (failedMessage.role === 'user') {
      setMessagesMap(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(m =>
          m.id === messageId
            ? { ...m, status: 'sending' as const, retryCount: 0 }
            : m
        )
      }));

      const payload = {
        conversation_id: conversationId,
        user_id: userId,
        content: failedMessage.content,
      };

      // Send with retry logic (will be handled by parent component)
      socket.emit("send_message", payload);
    } else if (failedMessage.role === 'assistant') {
      const messages = messagesMap[conversationId] || [];
      const aiMessageIndex = messages.findIndex(m => m.id === messageId);
      
      if (aiMessageIndex > 0) {
        const previousUserMessage = messages[aiMessageIndex - 1];
        
        if (previousUserMessage && previousUserMessage.role === 'user') {          
          setMessagesMap(prev => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).filter(m => m.id !== messageId)
          }));
          
          const payload = {
            conversation_id: conversationId,
            user_id: userId,
            content: previousUserMessage.content,
          };
          
          setIsWaitingForAI(true);
          socket.emit("send_message", payload, (response: { success: boolean; error?: string }) => {
            if (response && !response.success) {
              setIsWaitingForAI(false);
              message.error('Failed to retry AI response');
            }
          });
        }
      }
    }
  }, [socket, currentConversationId, messagesMap, userId, setMessagesMap]);

  // Copy message
  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard?.writeText(content).then(() => {
      message.success('Copied to clipboard');
    }).catch(() => {
      message.success('Copied to clipboard');
    });
  }, []);

  return {
    // messagesMap and setMessagesMap are now passed from parent, not returned
    messagePagination,
    setMessagePagination,
    isWaitingForAI,
    setIsWaitingForAI,
    loadedConversationsRef,
    handleLoadMoreMessages,
    handleRetryMessage,
    handleCopyMessage,
  };
};
