import { useCallback } from 'react';
import { message } from 'antd';
import { Socket } from 'socket.io-client';
import conversationService from '../services/conversation.service';
import { broadcastToTabs } from '../utils/tabSync';
import type { Message, Conversation, ChatState, AttachedFile, Files } from '../types/chat';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConversation = any;


interface MessagePaginationState {
  [conversationId: string]: {
    currentPage: number;
    totalPages: number;
    isLoading: boolean;
    hasMore: boolean;
  };
}

interface MessagePayload {
  conversation_id: string;
  user_id?: string | null;
  content: string;
  file_urls?: Files[];
}

interface UseSendMessageProps {
  currentConversationId: string | null;
  userId: string | null;
  socket: Socket | null;
  isLoading: boolean;
  isStreaming: boolean;
  operationLoading: { type: string | null };
  setMessagesMap: React.Dispatch<React.SetStateAction<{ [conversationId: string]: Message[] }>>;
  setIsWaitingForAI: React.Dispatch<React.SetStateAction<boolean>>;
  setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
  normalizeConversation: (conv: AnyConversation) => Conversation;
  setMessagePagination: React.Dispatch<React.SetStateAction<MessagePaginationState>>;
  loadedConversationsRef: React.MutableRefObject<Set<string>>;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

export const useSendMessage = ({
  currentConversationId,
  userId,
  socket,
  isLoading,
  isStreaming,
  operationLoading,
  setMessagesMap,
  setIsWaitingForAI,
  setChatState,
  normalizeConversation,
  setMessagePagination,
  loadedConversationsRef,
}: UseSendMessageProps) => {

  // Send message with retry logic
  const sendMessageWithRetry = useCallback((
    socketInstance: Socket,
    payload: MessagePayload,
    tempId: string,
    conversationId: string,
    maxRetries = 2,
    timeout = 15000,
    retryDelay = 2000
  ): Promise<{ success: boolean; error?: unknown }> => {
    return new Promise((resolve) => {
      let attempt = 0;
      let timeoutId: ReturnType<typeof setTimeout>;

      const trySend = () => {
        attempt++;
        
        // Clear previous timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        if (!socketInstance.connected) {
          if (attempt <= maxRetries) {
            setTimeout(trySend, retryDelay);
            return;
          }

          setMessagesMap(prev => ({
            ...prev,
            [conversationId]: prev[conversationId].map(msg =>
              msg.id === tempId ? { ...msg, status: "error" as const } : msg
            )
          }));
          return resolve({ success: false, error: "No internet" });
        }

        // Set global timeout for this attempt (including waiting for response)
        timeoutId = setTimeout(() => {
          if (attempt <= maxRetries) {
            // Retry after timeout
            setTimeout(trySend, retryDelay * attempt);
          } else {
            // Max retries reached, mark as error
            setIsWaitingForAI(false);
            setMessagesMap(prev => ({
              ...prev,
              [conversationId]: (prev[conversationId] || []).map(msg =>
                msg.id === tempId
                  ? { ...msg, status: 'error' as const, retryCount: attempt }
                  : msg
              )
            }));
            message.error('Request timeout. Please try again.');
            resolve({ success: false, error: "Timeout" });
          }
        }, timeout + (retryDelay * attempt)); // Increase timeout for each retry

        socketInstance.timeout(timeout).emit("send_message", payload, (response: { success: boolean; error?: string; errorCode?: number }) => {
          // Clear timeout since we got response
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          if (response && !response.success) {
            const errorCode = response.errorCode || 500;
            const errorMsg = response.error || "Unknown error";

            if (errorCode === 500 && attempt <= maxRetries) {
              setTimeout(trySend, retryDelay * attempt);
              return;
            }

            setIsWaitingForAI(false);
            
            setMessagesMap(prev => ({
              ...prev,
              [conversationId]: (prev[conversationId] || []).map(msg =>
                msg.id === tempId
                  ? { ...msg, status: 'error' as const, retryCount: attempt }
                  : msg
              )
            }));

            message.error(errorCode === 500 
              ? 'AI service unavailable. Please try again later.'
              : errorMsg
            );
            resolve({ success: false, error: response });
            return;
          }
          resolve({ success: true });
        });
      };

      trySend();
    });
  }, [setMessagesMap, setIsWaitingForAI]);

  // Send message
  const handleSendMessage = useCallback(async (content: string, files?: AttachedFile[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;
    if (isLoading || isStreaming || !!operationLoading.type) return;
    if (!socket) return;

    const tempId = generateId();
    let conversationId = currentConversationId;

    // Create new conversation if needed
    if (!conversationId) {
      try {
        const res = await conversationService.createConversation("New Chat");
        const conv = normalizeConversation(res);
        conversationId = conv.id;

        setChatState(prev => ({
          ...prev,
          conversations: [conv, ...prev.conversations],
          currentConversationId: conv.id,
        }));

        setMessagePagination(prev => ({
          ...prev,
          [conv.id]: {
            currentPage: 1,
            totalPages: 1,
            isLoading: false,
            hasMore: false,
          }
        }));

        setMessagesMap(prev => ({
          ...prev,
          [conv.id]: []
        }));

        loadedConversationsRef.current.add(conv.id);
        socket.emit("join_conversation", conv.id);
      } catch (error) {
        console.error("Failed to create new conversation:", error);
        message.error("Failed to create new chat");
        return;
      }
    }

    // ✅ Extract URLs from already uploaded files (no need to upload again)
    const uploadedFileUrls: Files[] = files
      ? files.filter(f => f.url).map(f => ({
        url: f.url || null,
        type: f.type,
      }))
      : [];



    // Create user message
    const userMessage: Message = {
      id: tempId,
      role: "user" as const,
      content,
      timestamp: new Date(),
      isTemp: true,
      status: 'sending' as const,
      retryCount: 0,
      attachments: uploadedFileUrls.length > 0 ? uploadedFileUrls : null,
    };

    setMessagesMap(prev => ({
      ...prev,
      [conversationId!]: [
        ...(prev[conversationId!] || []),
        userMessage
      ]
    }));

    // Broadcast to other tabs
    broadcastToTabs({
      type: 'new_message',
      payload: {
        conversationId: conversationId!,
        message: userMessage
      }
    });

    setIsWaitingForAI(true);

    broadcastToTabs({
      type: 'streaming_status',
      payload: { isStreaming: false, isWaitingForAI: true }
    });

    // Send message
    const payload = {
      conversation_id: conversationId,
      user_id: userId,
      content,
      file_urls: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined,
    };

    await sendMessageWithRetry(socket, payload, tempId, conversationId);
  }, [
    currentConversationId,
    userId,
    socket,
    isLoading,
    isStreaming,
    operationLoading.type,
    normalizeConversation,
    setChatState,
    setMessagePagination,
    setMessagesMap,
    loadedConversationsRef,
    setIsWaitingForAI,
    sendMessageWithRetry,
  ]);

  return { handleSendMessage, sendMessageWithRetry };
};
