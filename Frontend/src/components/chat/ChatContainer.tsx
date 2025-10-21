/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Typography, message, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import ChatSidebar from './ChatSidebar';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import type { Conversation, ChatState, Message } from '../../types/chat';
import { useAuth } from '../../contexts/AuthContext';
import conversationService from '../../services/conversation.service';
import messageService from '../../services/message.service';
import { useNavigate, useParams } from 'react-router-dom';
import  {useSocket } from "../../contexts/SocketContext";
import { formatMessage } from "../../utils/chat"
const { Title, Text } = Typography;

const ChatContainer: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>(); // Get conversation ID from URL
  
  const [chatState, setChatState] = useState<ChatState>({
    conversations: [],
    currentConversationId: null,
    isLoading: false,
    isStreaming: false,
  });

  // Separate messages state - key: conversationId, value: Message[]
  // Default loads 20 most recent messages per conversation
  const [messagesMap, setMessagesMap] = useState<{
    [conversationId: string]: Message[];
  }>({});

  // Track which conversations have had their messages loaded
  const loadedConversationsRef = React.useRef<Set<string>>(new Set());

  const [operationLoading, setOperationLoading] = useState<{
    type: 'create' | 'delete' | 'rename' | 'load' | null;
    conversationId?: string;
  }>({ type: null });

  const [isWaitingForAI, setIsWaitingForAI] = useState(false);

  // ✅ Track AI response timeout
  const aiResponseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentAIMessageRef = React.useRef<{ id: string; conversationId: string } | null>(null);

  // Pagination states
  const [messagePagination, setMessagePagination] = useState<{
    [conversationId: string]: {
      currentPage: number;
      totalPages: number;
      isLoading: boolean;
      hasMore: boolean;
    };
  }>({});

  const [conversationPagination, setConversationPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    isLoading: false,
    hasMore: true,
  });

  const { logout, userId, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Join conversation room khi mở cuộc chat
    if (chatState.currentConversationId) {
      socket.emit("join_conversation", chatState.currentConversationId);
    }

    // Lắng nghe tin từ user khác hoặc từ backend confirm
    socket.on("receive_message", (msg,callback) => {
      console.log("📨 Received message:", msg);
      const formattedMsg = formatMessage(msg);
      const convId = msg.conversation_id;

      setMessagesMap(prev => {
        const currentMessages = prev[convId] || [];
        
        // Check duplicate by ID
        const existsById = currentMessages.some(m => m.id === msg.id);
        if (existsById) {
          console.log("⛔ Duplicate message (by ID), skipping");
          return prev;
        }

        // Check if this is a confirmation of our temp message
        const tempIndex = currentMessages.findIndex(m => 
          m.isTemp && 
          m.content === formattedMsg.content && 
          m.role === formattedMsg.role
        );

        if (tempIndex !== -1) {
          // Replace temp message with real one
          console.log("🔄 Replacing temp message with real one");
          const updated = [...currentMessages];
          updated[tempIndex] = { ...formattedMsg, isTemp: false };
          return { ...prev, [convId]: updated };
        } else {
          // Add new message
          console.log("➕ Adding new message");
          return { ...prev, [convId]: [...currentMessages, formattedMsg] };
        }
      });
      if(callback) {
        callback({
          received: true,
          messageId: msg.id
        });
      }
    });

    // ✅ AI bắt đầu stream trả lời
    socket.on("ai_message_init", (aiMessage) => {
      console.log("🤖 AI init:", aiMessage);
      setIsWaitingForAI(false);
      setChatState(prev => ({ ...prev, isStreaming: true }));

      const convId = aiMessage.conversation_id;
      
      // ✅ Mark user message as sent (backend confirmed receipt)
      setMessagesMap(prev => ({
        ...prev,
        [convId]: (prev[convId] || []).map(m =>
          m.role === 'user' && m.isTemp && m.status === 'sending'
            ? { ...m, status: 'sent' as const, isTemp: false }
            : m
        )
      }));
      
      // Track current AI message for timeout
      currentAIMessageRef.current = {
        id: aiMessage.id,
        conversationId: convId,
      };

      // Clear any existing timeout
      if (aiResponseTimeoutRef.current) {
        clearTimeout(aiResponseTimeoutRef.current);
      }

      // Set timeout for AI response (60 seconds)
      aiResponseTimeoutRef.current = setTimeout(() => {
        console.error("⏰ AI response timeout!");
        setIsWaitingForAI(false);
        setChatState(prev => ({ ...prev, isStreaming: false }));

        // Mark message as error
        setMessagesMap(prev => ({
          ...prev,
          [convId]: (prev[convId] || []).map(m =>
            m.id === aiMessage.id
              ? { 
                  ...m, 
                  content: m.content || "⚠️ AI response timeout. Please try again.",
                  isStreaming: false,
                  status: 'error' as const
                }
              : m
          ),
        }));

        message.error("AI response timeout. Please try sending your message again.");
        currentAIMessageRef.current = null;
      }, 60000); // 60 seconds timeout

      setMessagesMap(prev => ({
        ...prev,
        [convId]: [
          ...(prev[convId] || []),
          {
            id: aiMessage.id,
            role: "assistant",
            content: "",
            isStreaming: true,
            timestamp: new Date(),
          },
        ],
      }));
    });

    // ✅ AI gửi từng chunk
    socket.on("ai_stream", ({ message_id, chunk, conversation_id }) => {
      setMessagesMap(prev => ({
        ...prev,
        [conversation_id]: (prev[conversation_id] || []).map(m =>
          m.id === message_id ? { ...m, content: (m.content || "") + chunk } : m
        ),
      }));
    });

    // ✅ AI trả lời xong
    socket.on("ai_stream_end", ({ message_id, real_message_id, full_content, conversation_id }) => {
      console.log("✅ AI finished:", message_id, "→ real ID:", real_message_id);
      
      // Clear timeout since we received the end event
      if (aiResponseTimeoutRef.current) {
        clearTimeout(aiResponseTimeoutRef.current);
        aiResponseTimeoutRef.current = null;
      }
      
      currentAIMessageRef.current = null;
      setIsWaitingForAI(false);
      setChatState(prev => ({ ...prev, isStreaming: false }));

      setMessagesMap(prev => {
        const updated = { ...prev };
        
        // Find conversation and update message
        if (conversation_id && updated[conversation_id]) {
          updated[conversation_id] = updated[conversation_id].map(m =>
            m.id === message_id
              ? { 
                  ...m, 
                  id: real_message_id || m.id, // ✅ Update to real DB ID
                  content: full_content, 
                  isStreaming: false, 
                  status: 'sent' as const,
                  isTemp: false // ✅ No longer temp
                }
              : m
          );
        } else {
          // Fallback: search all conversations
          for (const convId in updated) {
            updated[convId] = updated[convId].map(m =>
              m.id === message_id
                ? { 
                    ...m, 
                    id: real_message_id || m.id,
                    content: full_content, 
                    isStreaming: false, 
                    status: 'sent' as const,
                    isTemp: false
                  }
                : m
            );
          }
        }
        return updated;
      });
    });

    // ✅ Handle AI error (when AI service fails)
    socket.on("ai_error", ({ message_id, conversation_id, error, errorCode }) => {
      console.error("❌ AI error:", error, "Code:", errorCode);
      
      // Clear timeout and states
      if (aiResponseTimeoutRef.current) {
        clearTimeout(aiResponseTimeoutRef.current);
        aiResponseTimeoutRef.current = null;
      }
      
      currentAIMessageRef.current = null;
      setIsWaitingForAI(false);
      setChatState(prev => ({ ...prev, isStreaming: false }));

      // Remove AI placeholder or mark as error
      setMessagesMap(prev => {
        const messages = prev[conversation_id] || [];
        const aiMessageExists = messages.some(m => m.id === message_id);
        
        if (aiMessageExists) {
          // Mark as error
          return {
            ...prev,
            [conversation_id]: messages.map(m =>
              m.id === message_id
                ? { 
                    ...m, 
                    content: `⚠️ ${error || 'AI service temporarily unavailable'}`,
                    isStreaming: false,
                    status: 'error' as const
                  }
                : m
            )
          };
        } else {
          // Remove placeholder if not added yet
          return prev;
        }
      });

      message.error(error || 'AI service temporarily unavailable. Please try again.');
    });

    // ✅ Handle socket disconnect during AI response
    socket.on("disconnect", () => {
      console.warn("⚠️ Socket disconnected");
      
      // If AI was responding, mark as error
      if (currentAIMessageRef.current) {
        const { id, conversationId } = currentAIMessageRef.current;
        
        console.error("❌ Socket disconnected during AI response");
        setIsWaitingForAI(false);
        setChatState(prev => ({ ...prev, isStreaming: false }));
        
        setMessagesMap(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map(m =>
            m.id === id
              ? { 
                  ...m, 
                  content: m.content || "⚠️ Lost connection to AI service. Network disconnected.",
                  isStreaming: false,
                  status: 'error' as const
                }
              : m
          ),
        }));
        
        message.error("Connection to AI lost. Please check your network and try again.");
        currentAIMessageRef.current = null;
      } else {
        // ✅ General disconnect - not during AI response
        message.warning("Socket disconnected. Attempting to reconnect...");
      }
      
      // Clear timeout
      if (aiResponseTimeoutRef.current) {
        clearTimeout(aiResponseTimeoutRef.current);
        aiResponseTimeoutRef.current = null;
      }
    });

    // ✅ Handle socket reconnect
    socket.on("connect", () => {
      console.log("✅ Socket reconnected");
      
      // Rejoin current conversation
      if (chatState.currentConversationId) {
        socket.emit("join_conversation", chatState.currentConversationId);
      }
    });

    return () => {
      // Cleanup socket listeners
      socket.off("receive_message");
      socket.off("ai_message_init");
      socket.off("ai_stream");
      socket.off("ai_stream_end");
      socket.off("ai_error");
      socket.off("disconnect");
      socket.off("connect");
      
      // Clear AI response timeout
      if (aiResponseTimeoutRef.current) {
        clearTimeout(aiResponseTimeoutRef.current);
      }
    };
  }, [socket, chatState.currentConversationId]);



  // Helper: map backend conversation -> frontend shape
  // Note: messages are stored separately in messagesMap, not in conversation object
  const normalizeConversation = useCallback((conv: any): Conversation => ({
    id: conv.id,
    title: conv.conversation_name ?? conv.title ?? 'New Chat',
    user_id: conv.user_id ?? conv.userId ?? null,
    messages: [], // Always empty - messages stored in messagesMap
    createdAt: conv.createdAt ? new Date(conv.createdAt) : new Date(),
    updatedAt: conv.updatedAt ? new Date(conv.updatedAt) : new Date(),
  }), []);

  // Load conversations from backend
  const loadConversations = useCallback(async (opts: { signal?: AbortSignal; selectConversationId?: string | null; manageLoading?: boolean; page?: number; append?: boolean } = {}) => {
    const { signal, selectConversationId = null, manageLoading = true, page = 1, append = false } = opts;

    setChatState(prev => ({ ...prev, isLoading: manageLoading ? true : prev.isLoading }));

    // Update pagination loading state
    if (append) {
      setConversationPagination(prev => ({ ...prev, isLoading: true }));
    }

    // If not logged in: clear list
    if (!userId) {
      setChatState({
        conversations: [],
        currentConversationId: null,
        isLoading: false,
        isStreaming: false,
      });
      setConversationPagination({ currentPage: 1, totalPages: 1, isLoading: false, hasMore: false });
      return;
    }

    try {
      const limit = 20;
      const response = await conversationService.getUserConversations({ signal, page, limit });

      const rawConversations = response?.conversations ?? [];
      const total = response?.pagination?.total ?? 0;
      const totalPages = Math.ceil(total / limit);

      console.log(`[ChatContainer] Loaded conversations page ${page}:`, rawConversations.length, 'of', total);

      const normalized = rawConversations.map((c) => normalizeConversation(c));

      setChatState(prev => {
        let updatedConversations;
        if (append) {
          // Remove duplicates when appending
          const existingIds = new Set(prev.conversations.map(c => c.id));
          const newConversations = normalized.filter(c => !existingIds.has(c.id));
          updatedConversations = [...prev.conversations, ...newConversations];
        } else {
          updatedConversations = normalized;
        }

        const prevCurrent = prev.currentConversationId;
        const preferred = selectConversationId ?? prevCurrent;
        const targetId = preferred && updatedConversations.some((c) => c.id === preferred)
          ? preferred
          : (updatedConversations[0]?.id ?? null);

        return {
          ...prev,
          conversations: updatedConversations,
          currentConversationId: targetId,
          isLoading: false,
        };
      });

      // Update pagination state
      setConversationPagination({
        currentPage: page,
        totalPages,
        isLoading: false,
        hasMore: page < totalPages,
      });
    } 
    catch (err: any) {
          if (signal?.aborted) {
            return;
          }
          console.error('Failed to load conversations', err);
          message.error('Could not load conversations from server.');
          setChatState({
            conversations: [],
            currentConversationId: null,
            isLoading: false,
            isStreaming: false,
          });
          setConversationPagination({ currentPage: 1, totalPages: 1, isLoading: false, hasMore: false });
        }
      }, [userId, normalizeConversation]);

  // Load on auth ready, userId changes, or refreshTrigger
  useEffect(() => {
    if (!isAuthReady) return;

    if (!userId) {
      // not logged in — clear everything
      setChatState({
        conversations: [],
        currentConversationId: null,
        isLoading: false,
        isStreaming: false,
      });
      setMessagesMap({});
      loadedConversationsRef.current.clear();
      return;
    }

    // Clear loaded tracking on user change
    loadedConversationsRef.current.clear();

    const controller = new AbortController();
    loadConversations({ signal: controller.signal, page: 1, append: false });

    return () => controller.abort();
  }, [isAuthReady, userId, loadConversations]);

  // Sync URL params with currentConversationId
  useEffect(() => {
    console.log(`🔗 URL sync: chatId=${chatId}, currentConversationId=${chatState.currentConversationId}, conversations=${chatState.conversations.length}`);
    
    if (!chatId) {
      // No chatId in URL - redirect to first conversation or stay at /chat
      if (chatState.conversations.length > 0 && !chatState.currentConversationId) {
        console.log(`↪️ Redirecting to first conversation: ${chatState.conversations[0].id}`);
        navigate(`/chat/${chatState.conversations[0].id}`, { replace: true });
      }
      return;
    }

    // If chatId in URL is different from current, update current conversation
    if (chatId !== chatState.currentConversationId) {
      console.log(`📍 URL changed to conversation: ${chatId}`);
      setChatState(prev => ({ ...prev, currentConversationId: chatId }));
    }
  }, [chatId, chatState.conversations, chatState.currentConversationId, navigate]);

  // Load messages for current conversation when it changes
  useEffect(() => {
    const loadMessagesForCurrentConversation = async () => {
      if (!chatState.currentConversationId) return;
      
      // Wait for conversations to be loaded first
      if (chatState.isLoading) {
        console.log('⏳ Waiting for conversations to load...');
        return;
      }
      
      const conv = chatState.conversations.find(c => c.id === chatState.currentConversationId);
      if (!conv) {
        console.log(`⚠️ Conversation ${chatState.currentConversationId} not found in list`);
        return;
      }
      
      // Check if we've already loaded messages for this conversation
      if (loadedConversationsRef.current.has(chatState.currentConversationId)) {
        console.log(`✅ Conversation ${chatState.currentConversationId} already loaded, skipping`);
        return;
      }
      
      // Mark as loaded BEFORE loading to prevent duplicate requests
      console.log(`🔖 Marking conversation ${chatState.currentConversationId} as loaded`);
      loadedConversationsRef.current.add(chatState.currentConversationId);
      
      try {
        console.log(`📥 Loading messages for conversation ${chatState.currentConversationId}...`);
        
        const { messages, pagination } = await messageService.getMessagesByConversation(
          chatState.currentConversationId,
          { page: 1, limit: 5 } // Load first 5 messages for easier testing
        );
        
        console.log(`✅ Loaded ${messages.length} messages`);
        
        // Sort messages by timestamp (oldest first) for display
        const sortedMessages = [...messages].sort((a, b) => 
          a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        // Save to messagesMap
        setMessagesMap(prev => ({
          ...prev,
          [chatState.currentConversationId!]: sortedMessages
        }));

        // Update pagination state
        const paginationState = {
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          isLoading: false,
          hasMore: pagination.page < pagination.totalPages,
        };
        console.log(`📊 Pagination state:`, paginationState);
        
        setMessagePagination(prev => ({   
          ...prev,
          [chatState.currentConversationId!]: paginationState,
        }));
      } catch (err) {
        console.error('Failed to load messages for conversation', err);
        // Still set pagination state to prevent infinite retries
        setMessagePagination(prev => ({
          ...prev,
          [chatState.currentConversationId!]: {
            currentPage: 1,
            totalPages: 1,
            isLoading: false,
            hasMore: false,
          }
        }));
      }
    };

    loadMessagesForCurrentConversation();
  }, [chatState.currentConversationId, chatState.conversations, chatState.isLoading]);

  // Load more older messages (pagination)
  const handleLoadMoreMessages = useCallback(async () => {
    if (!chatState.currentConversationId) return;
    
    const pagination = messagePagination[chatState.currentConversationId];
    if (!pagination || pagination.isLoading || !pagination.hasMore) return;

    try {
      const nextPage = pagination.currentPage + 1;
      
      setMessagePagination(prev => ({
        ...prev,
        [chatState.currentConversationId!]: {
          ...prev[chatState.currentConversationId!],
          isLoading: true,
        }
      }));

      const { messages: olderMessages, pagination: newPagination } = await messageService.getMessagesByConversation(
        chatState.currentConversationId,
        { page: nextPage, limit: 5 } // Load 5 messages per page for easier testing
      );

      // Sort older messages by timestamp (oldest first)
      const sortedOlderMessages = [...olderMessages].sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );

      // Prepend older messages to the beginning in messagesMap
      setMessagesMap(prev => ({
        ...prev,
        [chatState.currentConversationId!]: [
          ...sortedOlderMessages,
          ...(prev[chatState.currentConversationId!] || [])
        ]
      }));

      setMessagePagination(prev => ({
        ...prev,
        [chatState.currentConversationId!]: {
          currentPage: newPagination.page,
          totalPages: newPagination.totalPages,
          isLoading: false,
          hasMore: newPagination.page < newPagination.totalPages,
        }
      }));

      console.log(`✅ Loaded page ${nextPage} of messages`);
    } catch (err) {
      console.error('Failed to load more messages', err);
      setMessagePagination(prev => ({
        ...prev,
        [chatState.currentConversationId!]: {
          ...prev[chatState.currentConversationId!],
          isLoading: false,
        }
      }));
    }
  }, [chatState.currentConversationId, messagePagination]);

  const handleLoadMoreConversations = useCallback(async () => {
    if (conversationPagination.isLoading || !conversationPagination.hasMore) return;

    const nextPage = conversationPagination.currentPage + 1;
    console.log(`📄 Loading more conversations (page ${nextPage})...`);
    
    await loadConversations({ page: nextPage, append: true, manageLoading: false });
  }, [conversationPagination, loadConversations]);

  const currentConversation = useMemo(() => {
    return chatState.conversations.find(c => c.id === chatState.currentConversationId) ?? null;
  }, [chatState.conversations, chatState.currentConversationId]);

  // Utilities
  const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

  // ✅ Send message with retry logic (only retry on 500 errors)
  const sendMessageWithRetry = useCallback((
    socket: any,
    payload: any,
    tempId: string,
    conversationId: string,
    maxRetries = 2, // ✅ Max 2 retries on 500 errors
    timeout = 15000,
    retryDelay = 2000
  ): Promise<{ success: boolean; error?: any }> => {
    return new Promise((resolve) => {
      let attempt = 0;

      const trySend = () => {
        attempt++;
        console.log(`📤 Sending message (attempt ${attempt}/${maxRetries + 1})...`);
        if (!socket.connected) {
          console.warn("⚠️ Không có kết nối mạng!");

          if (attempt <= maxRetries) {
            console.log(`🔄 Đợi kết nối lại... retry sau ${retryDelay}ms`);
            setTimeout(trySend, retryDelay);
            return;
          }

          // ❌ Sau số lần retry vẫn không có mạng → báo lỗi luôn
          setMessagesMap(prev => ({
            ...prev,
            [conversationId]: prev[conversationId].map(msg =>
              msg.id === tempId ? { ...msg, status: "error" } : msg
            )
          }));
          return resolve({ success: false, error: "No internet" });
        }

        // ✅ Use callback to get response from backend
        socket.timeout(timeout).emit("send_message", payload, (response: any) => {
          // Check if it's an error response
          if (response && !response.success) {
            const errorCode = response.errorCode || 500;
            const errorMsg = response.error || "Unknown error";
            console.log(response)
            console.warn(`⚠️ Attempt ${attempt} failed with code ${errorCode}:`, errorMsg);
            
            // ✅ Only retry on 500 errors (server/AI errors)
            if (errorCode === 500 && attempt <= maxRetries) {
              console.log(`🔄 Retrying due to server error (${attempt}/${maxRetries})...`);
              setTimeout(trySend, retryDelay * attempt); // Exponential backoff
              return;
            }
            
            // All retries failed or non-retryable error
            console.error(`❌ Failed after ${attempt} attempt(s)`);
            
            // Clear AI waiting state
            setIsWaitingForAI(false);
            
            // Update status to error
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
          
          // ✅ Success - backend confirmed message received
          console.log(`✅ Message accepted by server on attempt ${attempt}`);
          resolve({ success: true });
        });
      };

      trySend();
    });
  }, []);

  // ✅ Retry failed message (user or AI)
  const handleRetryMessage = useCallback(async (messageId: string) => {
    if (!socket || !chatState.currentConversationId) return;

    const conversationId = chatState.currentConversationId;
    const failedMessage = messagesMap[conversationId]?.find(m => m.id === messageId);

    if (!failedMessage || failedMessage.status !== 'error') return;

    console.log('🔄 Retrying failed message:', messageId);

    // Check if it's user message or AI message
    if (failedMessage.role === 'user') {
      // ✅ Reset status to 'sending' before retry
      setMessagesMap(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(m =>
          m.id === messageId
            ? { ...m, status: 'sending' as const, retryCount: 0 }
            : m
        )
      }));

      // Retry user message
      const payload = {
        conversation_id: conversationId,
        user_id: userId,
        content: failedMessage.content,
      };

      const result = await sendMessageWithRetry(socket, payload, messageId, conversationId);
      
      // ✅ If retry successful, status will be updated by ai_message_init
      if (!result.success) {
        console.error('❌ Retry failed');
      }
      
    } else if (failedMessage.role === 'assistant') {
      // Retry AI response - find the previous user message
      const messages = messagesMap[conversationId] || [];
      const aiMessageIndex = messages.findIndex(m => m.id === messageId);
      
      if (aiMessageIndex > 0) {
        const previousUserMessage = messages[aiMessageIndex - 1];
        
        if (previousUserMessage && previousUserMessage.role === 'user') {
          console.log('🔄 Retrying AI response for user message:', previousUserMessage.content);
          
          // Remove failed AI message
          setMessagesMap(prev => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).filter(m => m.id !== messageId)
          }));
          
          // Resend user message to trigger new AI response
          const payload = {
            conversation_id: conversationId,
            user_id: userId,
            content: previousUserMessage.content,
          };
          
          setIsWaitingForAI(true);
          socket.emit("send_message", payload, (response: any) => {
            if (response && !response.success) {
              setIsWaitingForAI(false);
              message.error('Failed to retry AI response');
            }
          });
        }
      }
    }
  }, [socket, chatState.currentConversationId, messagesMap, userId, sendMessageWithRetry]);

  // Send message with API integration
  const handleSendMessage = useCallback(async (content: string, needsSuggestions = false) => {
    if (!content.trim()) return;
    if (chatState.isLoading || chatState.isStreaming || !!operationLoading.type) return;
    if (!socket) return;

    const tempId = generateId();

    let conversationId = chatState.currentConversationId;

    // Nếu chưa có conversation -> tạo mới
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

        // Initialize pagination state for new conversation
        setMessagePagination(prev => ({
          ...prev,
          [conv.id]: {
            currentPage: 1,
            totalPages: 1,
            isLoading: false,
            hasMore: false,
          }
        }));

        // Initialize empty messages array for new conversation
        setMessagesMap(prev => ({
          ...prev,
          [conv.id]: []
        }));

        // Mark as loaded to prevent loading from API
        loadedConversationsRef.current.add(conv.id);

        // ✅ join socket room
        socket.emit("join_conversation", conv.id);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        message.error("Failed to create new chat");
        return;
      }
    }

    // ✅ Hiện tin nhắn user ngay lập tức với status "sending"
    setMessagesMap(prev => ({
      ...prev,
      [conversationId!]: [
        ...(prev[conversationId!] || []),
        {
          id: tempId,
          role: "user",
          content,
          timestamp: new Date(),
          isTemp: true,
          status: 'sending', // ✅ Initial status
          retryCount: 0,
        }
      ]
    }));

    // Show "AI is thinking..." indicator
    setIsWaitingForAI(true);

    // ✅ Gửi tin nhắn qua websocket với retry logic
    const payload = {
      conversation_id: conversationId,
      user_id: userId,
      content,
      needs_suggestions: needsSuggestions,
    };

    await sendMessageWithRetry(socket, payload, tempId, conversationId);

  }, [chatState.currentConversationId, chatState.isLoading, chatState.isStreaming, operationLoading.type, socket, userId, normalizeConversation, sendMessageWithRetry]);


  // Create new conversation (persisted)
  const handleNewConversation = useCallback(async () => {
    setOperationLoading({ type: 'create' });
    const hide = message.loading('Creating conversation...', 0);
    try {
      const res = await conversationService.createConversation('New Chat');
      const newConvId = res.id.toString();

      // Navigate to new conversation URL
      navigate(`/chat/${newConvId}`);

      // Reload conversations from page 1 to get the new conversation
      await loadConversations({ page: 1, append: false, selectConversationId: newConvId });

      hide();
      message.success('New conversation created');
    } catch (err) {
      hide();
      console.error('Failed to create conversation', err);
      message.error('Failed to create conversation');
    } finally {
      setOperationLoading({ type: null });
    }
  }, [loadConversations, navigate]);

  // Select conversation (if not present, fetch it)
  const handleSelectConversation = useCallback(async (id: string) => {
    // Navigate to conversation URL
    navigate(`/chat/${id}`);
    
    // if already present -> just select (messages will be loaded by useEffect)
    const exists = chatState.conversations.some(c => c.id === id);
    if (exists) {
      // setChatState will be updated by URL sync useEffect
      return;
    }

    // If conversation not in list, fetch it from backend
    setOperationLoading({ type: 'load', conversationId: id });
    const hide = message.loading('Loading conversation...', 0);

    try {
      const res = await conversationService.getConversation(id);
      const conv = normalizeConversation(res);

      setChatState(prev => ({
        ...prev,
        conversations: [conv, ...prev.conversations],
        currentConversationId: conv.id,
      }));

      hide();
      // Messages will be loaded automatically by the useEffect hook
    } catch (err) {
      hide();
      console.error('Failed to load conversation', err);
      message.error('Failed to load conversation');
    } finally {
      setOperationLoading({ type: null });
    }
  }, [chatState.conversations, normalizeConversation, navigate]);

  // Delete conversation
  const handleDeleteConversation = useCallback(async (id: string) => {
    setOperationLoading({ type: 'delete', conversationId: id });
    const hide = message.loading('Deleting conversation...', 0);

    try {
      await conversationService.deleteConversation(id);

      // Determine which conversation to select after deletion
      const remaining = chatState.conversations.filter(c => c.id !== id);
      const newCurrentId = chatState.currentConversationId === id 
        ? (remaining[0]?.id ?? null) 
        : chatState.currentConversationId;

      // If we deleted the current conversation, navigate to the new one
      if (chatState.currentConversationId === id) {
        if (newCurrentId) {
          navigate(`/chat/${newCurrentId}`, { replace: true });
        } else {
          navigate('/chat', { replace: true });
        }
      }

      // Reload conversations from page 1
      await loadConversations({ page: 1, append: false, selectConversationId: newCurrentId });

      hide();
      message.success('Conversation deleted');
    } catch (err) {
      hide();
      console.error('Failed to delete conversation', err);
      message.error('Failed to delete conversation');
      // Refresh from server to keep UI consistent
      await loadConversations({ page: 1, append: false });
    } finally {
      setOperationLoading({ type: null });
    }
  }, [chatState.conversations, chatState.currentConversationId, loadConversations, navigate]);

  // Rename conversation (backend expects conversation_name, conversationService handles payload)
  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    setOperationLoading({ type: 'rename', conversationId: id });
    const hide = message.loading('Renaming conversation...', 0);

    try {
      // call API (conversationService should send conversation_name)
      await conversationService.renameConversation(id, newTitle);

      // update locally: we map title <- conversation_name on load, so update title here
      setChatState(prev => ({
        ...prev,
        conversations: prev.conversations.map(c => c.id === id ? { ...c, title: newTitle, updatedAt: new Date() } : c),
      }));

      hide();
      message.success('Conversation renamed');
    } catch (err) {
      hide();
      console.error('Failed to rename conversation', err);
      message.error('Failed to rename conversation');
      // optional: refresh to sync
      // setRefreshTrigger(t => t + 1);
    } finally {
      setOperationLoading({ type: null });
    }
  }, []);

  const handleOpenSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    const hide = message.loading('Signing out…', 0);
    const success = await logout();
    hide();

    if (success) {
      message.success('Signed out');
    } else {
      message.warning('Signed out locally. Please sign in again.');
    }

    navigate('/signin', { replace: true });
  }, [logout, navigate]);

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard?.writeText(content).then(() => {
      message.success('Copied to clipboard');
    }).catch(() => {
      // fallback
      console.log('Copied:', content);
      message.success('Copied to clipboard');
    });
  }, []);

  const currentTitle = useMemo(() => currentConversation?.title ?? 'New Chat', [currentConversation]);
  
  // Get current messages from messagesMap
  const currentMessages = useMemo(() => {
    const messages = chatState.currentConversationId 
      ? messagesMap[chatState.currentConversationId] || []
      : [];
    
    console.log(`🔍 Current messages for ${chatState.currentConversationId}:`, messages.length, messages);
    return messages;
  }, [chatState.currentConversationId, messagesMap]);
  
  const hasMessages = useMemo(() => currentMessages.length > 0, [currentMessages]);

  const styles = useMemo(() => ({
    page: {
      minHeight: '100vh',
      display: 'flex',
      background: '#ffffff',
    } as React.CSSProperties,
    sidebar: {
      width: 380,
      flexShrink: 0,
      height: '100vh',
      position: 'sticky' as const,
      top: 0,
      background: '#ffffff',
      padding: 0,
      borderRight: '1px solid #e5e7eb',
    } as React.CSSProperties,
    content: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
      overflow: 'hidden',
      height: '100vh', // Fixed height like sidebar
    } as React.CSSProperties,
    chatCard: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
      borderRadius: 0,
      border: 'none',
      background: '#ffffff',
      minHeight: 0, // Critical for flex shrinking
      overflow: 'hidden', // Prevent expanding
    } as React.CSSProperties,
    header: {
      marginBottom: 0,
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      borderBottom: '1px solid #e5e7eb',
      background: '#ffffff',
    } as React.CSSProperties,
    headerInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      flex: 1,
    } as React.CSSProperties,
    headerTitle: {
      margin: 0,
      color: '#1f2937',
    } as React.CSSProperties,
    headerSubtitle: {
      color: '#6b7280',
    } as React.CSSProperties,
    messages: {
      flex: 1,
      minHeight: 0, // Allow flex item to shrink and enable scrolling
      overflow: 'auto', // Allow scrolling
      padding: '24px',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
    } as React.CSSProperties,
    inputContainer: {
      padding: '16px 24px',
      borderTop: '1px solid #e5e7eb',
      background: '#ffffff',
    } as React.CSSProperties,
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255, 255, 255, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 0,
      zIndex: 10,
      backdropFilter: 'blur(4px)',
    } as React.CSSProperties,
  }), []);

  return (
    <div style={styles.page}>
      {/* Fixed Sidebar on Left */}
      <div style={styles.sidebar}>
        <ChatSidebar
          conversations={chatState.conversations}
          currentConversationId={chatState.currentConversationId}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onClose={() => {/* No-op */}}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
          userName="Your workspace"
          userEmail="active session"
          onLoadMore={handleLoadMoreConversations}
          hasMore={conversationPagination.hasMore}
          isLoadingMore={conversationPagination.isLoading}
        />
      </div>

      {/* Chat Content Area */}
      <div style={styles.content}>
        <div style={{ ...styles.chatCard, position: 'relative' }}>
          {operationLoading.type && (
            <div style={styles.loadingOverlay}>
              <Spin
                size="large"
                indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />}
              />
            </div>
          )}

          <div style={styles.header}>
            <div style={styles.headerInfo}>
              <Title level={4} style={styles.headerTitle}>
                {currentTitle}
              </Title>
              <Text style={styles.headerSubtitle}>
                {chatState.isStreaming ? (
                  <span>
                    <LoadingOutlined style={{ marginRight: 8 }} />
                    AI is typing…
                  </span>
                ) : hasMessages ? (
                  `${currentMessages.length} messages`
                ) : (
                  'Start a new conversation'
                )}
              </Text>
            </div>
          </div>

          <div style={styles.messages}>
            <MessageList
              messages={currentMessages}
              isLoading={isWaitingForAI}
              onCopyMessage={handleCopyMessage}
              onLoadMore={handleLoadMoreMessages}
              hasMore={chatState.currentConversationId ? messagePagination[chatState.currentConversationId]?.hasMore : false}
              isLoadingMore={chatState.currentConversationId ? messagePagination[chatState.currentConversationId]?.isLoading : false}
              onRetryMessage={handleRetryMessage}
            />
          </div>

          <div style={styles.inputContainer}>
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={!!operationLoading.type}
              placeholder="Type your message..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
