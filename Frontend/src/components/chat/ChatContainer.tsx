/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Typography, message, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import ChatSidebar from './ChatSidebar';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import type { Conversation, ChatState, Message } from '../../types/chat';
import { useAuth } from '../../contexts/AuthContext';
// import conversationService from '../../services/conversation.service'; // Now used by useConversations hook
// import messageService from '../../services/message.service'; // Now used by useMessages hook
import { useNavigate, useParams } from 'react-router-dom';
import  {useSocket } from "../../contexts/SocketContext";
// import { formatMessage } from "../../utils/chat" // Now used inside useSocketEvents hook
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { useTabSync } from '../../hooks/useTabSync';
import { useConversations } from '../../hooks/useConversations';
import { useMessages } from '../../hooks/useMessages';
import { useSendMessage } from '../../hooks/useSendMessage';
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

  // ✅ Keep setters for hooks to use, but hooks manage the actual state
  const [, setIsWaitingForAI] = useState(false);

  // ✅ Track AI response timeout - Now managed by useSocketEvents hook
  // const aiResponseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // const currentAIMessageRef = React.useRef<{ id: string; conversationId: string } | null>(null);

  // Pagination states - Now managed by custom hooks
  const [messagePagination, setMessagePagination] = useState<{
    [conversationId: string]: {
      currentPage: number;
      totalPages: number;
      isLoading: boolean;
      hasMore: boolean;
    };
  }>({});

  // const [conversationPagination, setConversationPagination] = useState({
  //   currentPage: 1,
  //   totalPages: 1,
  //   isLoading: false,
  //   hasMore: true,
  // });

  const { logout, userId, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();

  // ✅ Helper function to normalize conversation data from API
  const normalizeConversation = useCallback((conv: any): Conversation => ({
    id: conv.id,
    title: conv.conversation_name ?? conv.title ?? 'New Chat',
    user_id: conv.user_id ?? conv.userId ?? null,
    messages: [], // Always empty - messages stored in messagesMap
    createdAt: conv.createdAt ? new Date(conv.createdAt) : new Date(),
    updatedAt: conv.updatedAt ? new Date(conv.updatedAt) : new Date(),
  }), []);

  // ✅ Custom hooks replace all the old logic above
  useSocketEvents({
    socket,
    currentConversationId: chatState.currentConversationId,
    setMessagesMap,
    setChatState,
    setIsWaitingForAI,
  });

  useTabSync({
    setMessagesMap,
    setChatState,
    setIsWaitingForAI,
  });

  const {
    conversationPagination: hookConversationPagination,
    operationLoading: hookOperationLoading,
    loadConversations,
    handleNewConversation,
    handleSelectConversation,
    handleDeleteConversation,
    handleRenameConversation,
    handleLoadMoreConversations,
  } = useConversations({
    chatState,
    setChatState,
    userId,
    normalizeConversation,
  });

  const {
    messagePagination: hookMessagePagination,
    isWaitingForAI: hookIsWaitingForAI,
    handleLoadMoreMessages,
    handleRetryMessage,
    handleCopyMessage: hookHandleCopyMessage,
  } = useMessages({
    currentConversationId: chatState.currentConversationId,
    conversations: chatState.conversations,
    isLoading: chatState.isLoading,
    userId,
    socket,
    messagesMap,
    setMessagesMap,
  });

  const { handleSendMessage } = useSendMessage({
    currentConversationId: chatState.currentConversationId,
    userId,
    socket,
    isLoading: chatState.isLoading,
    isStreaming: chatState.isStreaming,
    operationLoading: hookOperationLoading,
    setMessagesMap,
    setIsWaitingForAI,
    setChatState,
    normalizeConversation,
    setMessagePagination,
    loadedConversationsRef,
  });

  // ✅ Use hook values directly (they manage the shared state)
  const finalMessagesMap = messagesMap; // Shared state updated by hooks
  const finalMessagePagination = Object.keys(hookMessagePagination).length > 0 ? hookMessagePagination : messagePagination;
  const finalIsWaitingForAI = hookIsWaitingForAI;
  const finalOperationLoading = hookOperationLoading;
  const finalConversationPagination = hookConversationPagination;

  // ✅ Utility functions
  const currentConversation = useMemo(() => {
    return chatState.conversations.find(c => c.id === chatState.currentConversationId) ?? null;
  }, [chatState.conversations, chatState.currentConversationId]);

  // ✅ Initial load: Load conversations on mount
  useEffect(() => {
    if (!isAuthReady) return;
    
    const abortController = new AbortController();
    loadConversations({ 
      signal: abortController.signal, 
      selectConversationId: chatId || null 
    });

    return () => abortController.abort();
  }, [isAuthReady, chatId, loadConversations]);

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

  // ✅ handleCopyMessage is now provided by useMessages hook (hookHandleCopyMessage)

  const currentTitle = useMemo(() => currentConversation?.title ?? 'New Chat', [currentConversation]);
  
  // Get current messages from messagesMap (use hook values)
  const currentMessages = useMemo(() => {
    const messages = chatState.currentConversationId 
      ? finalMessagesMap[chatState.currentConversationId] || []
      : [];
    
    console.log(`🔍 Current messages for ${chatState.currentConversationId}:`, messages.length, messages);
    return messages;
  }, [chatState.currentConversationId, finalMessagesMap]);
  
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
          hasMore={finalConversationPagination.hasMore}
          isLoadingMore={finalConversationPagination.isLoading}
        />
      </div>

      {/* Chat Content Area */}
      <div style={styles.content}>
        <div style={{ ...styles.chatCard, position: 'relative' }}>
          {finalOperationLoading.type && (
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
              isLoading={finalIsWaitingForAI}
              onCopyMessage={hookHandleCopyMessage}
              onLoadMore={handleLoadMoreMessages}
              hasMore={chatState.currentConversationId ? finalMessagePagination[chatState.currentConversationId]?.hasMore : false}
              isLoadingMore={chatState.currentConversationId ? finalMessagePagination[chatState.currentConversationId]?.isLoading : false}
              onRetryMessage={handleRetryMessage}
            />
          </div>

          <div style={styles.inputContainer}>
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={!!finalOperationLoading.type}
              placeholder="Type your message..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
