/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Typography, message, Spin, Button, Space } from 'antd';
import { LoadingOutlined, StarFilled } from '@ant-design/icons';
import ChatSidebar from './ChatSidebar';
import type { ChatSidebarRef } from './ChatSidebar';
import MessageList from './MessageList';
import ChatInput from './ChatInput'; // ✅ Import component
import type { ChatInputRef } from './ChatInput'; // ✅ Import ref type
import SearchModal from './SearchModal';
import ImportantDrawer from './ImportantDrawer';
import SemanticChatDrawer from './SemanticChatDrawer';
import SelectionPopover from './SelectionPopover'; // ✅ New component
import DragAndDropProvider from './DragAndDropProvider'; // ✅ Drag & Drop
import type { Conversation, ChatState, Message } from '../../types/chat';
import { useAuth } from '../../contexts/AuthContext';
// import conversationService from '../../services/conversation.service'; // Now used by useConversations hook
import messageService from '../../services/message.service';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import  {useSocket } from "../../contexts/SocketContext";
// import { formatMessage } from "../../utils/chat" // Now used inside useSocketEvents hook
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { useTabSync } from '../../hooks/useTabSync';
import { useConversations } from '../../hooks/useConversations';
import { useMessages } from '../../hooks/useMessages';
import { useSendMessage } from '../../hooks/useSendMessage';
import { broadcastToTabs } from '../../utils/tabSync';
const { Title } = Typography;

const ChatContainer: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>(); // Get conversation ID from URL
  const location = useLocation();
  
  // ✅ Create ref để control ChatInput
  const chatInputRef = useRef<ChatInputRef>(null);
  const chatSidebarRef = useRef<ChatSidebarRef>(null); // ✅ Ref for ChatSidebar
  
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
    project_id: conv.project_id ?? null, // ✅ Include project_id
  }), []);

  // Get loadConversations from hook first
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

  // ✅ Helper: Reload conversations to get updated order
  const refreshConversationOrder = useCallback(() => {
    console.log('🔄 Refreshing conversation order...');
    loadConversations({ page: 1, append: false, manageLoading: false });
  }, [loadConversations]);

  // ✅ Custom hooks replace all the old logic above
  useSocketEvents({
    socket,
    currentConversationId: chatState.currentConversationId,
    setMessagesMap,
    setChatState,
    setIsWaitingForAI,
    refreshConversationOrder, // ✅ Pass refresh callback
  });

  useTabSync({
    setMessagesMap,
    setChatState,
    setIsWaitingForAI,
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

  // ✅ Search modal state
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [importantDrawerVisible, setImportantDrawerVisible] = useState(false);

  const handleOpenSearch = useCallback(() => {
    setSearchModalVisible(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setSearchModalVisible(false);
  }, []);

  const handleOpenImportant = useCallback(() => {
    setImportantDrawerVisible(true);
  }, []);

  const handleCloseImportant = useCallback(() => {
    setImportantDrawerVisible(false);
  }, []);

  // Scroll to specific message
  // ✅ Smart scroll: Load messages if needed, then scroll
  const handleScrollToMessage = useCallback(async (messageId: string) => {
    if (!chatState.currentConversationId) return;

    const conversationId = chatState.currentConversationId;
    const currentMessages = messagesMap[conversationId] || [];
    
    // Check if message exists in current loaded messages
    const messageExists = currentMessages.some(m => m.id === messageId);
    
    if (!messageExists) {
      // ✅ Message not loaded yet - need to fetch all messages up to this one
      try {
        message.loading('Loading message...', 0.5);
        
        // Fetch all messages for this conversation (large limit to get all)
        const response = await messageService.getMessagesByConversation(conversationId, {
          page: 1,
          limit: 1000, // Large limit to ensure we get all messages
        });
        
        // Update messages map with all messages
        setMessagesMap(prev => ({
          ...prev,
          [conversationId]: response.messages,
        }));
        
        // Wait for DOM update
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Failed to load messages:', error);
        message.error('Failed to load message');
        return;
      }
    }
    
    // Now scroll to the message
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      messageElement.style.backgroundColor = '#fff7e6';
      setTimeout(() => {
        messageElement.style.backgroundColor = '';
      }, 2000);
    } else {
      message.warning('Message not found');
    }
  }, [chatState.currentConversationId, messagesMap, setMessagesMap]);

  // ✅ Handle text selection → Fill input và focus
  const handleAskAIAboutSelection = useCallback((selectedText: string) => {
    if (!chatState.currentConversationId) {
      message.warning('Please select a conversation first');
      return;
    }

    // ✅ Điền text vào input
    chatInputRef.current?.setInputValue(selectedText);
    
    // ✅ Focus vào input sau 100ms để đảm bảo text đã được set
    setTimeout(() => {
      chatInputRef.current?.focusInput();
    }, 100);
    
    message.success('Text filled in input - You can edit before sending');
  }, [chatState.currentConversationId]);

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

  // ✅ Handle scroll to message from search/navigation
  useEffect(() => {
    const state = location.state as { scrollToMessageId?: string; highlightMessageId?: string } | undefined;
    if (state?.scrollToMessageId && chatState.currentConversationId) {
      // Wait for messages to load, then scroll
      const timer = setTimeout(() => {
        handleScrollToMessage(state.scrollToMessageId!);
        // Clear the state to prevent re-scrolling
        window.history.replaceState({}, document.title);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [location.state, chatState.currentConversationId, handleScrollToMessage]);

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

  const handleToggleImportant = useCallback(async (messageId: string, important: boolean) => {
    const conversationId = chatState.currentConversationId;
    if (!conversationId) return;

    // Optimistic update
    setMessagesMap(prev => ({
      ...prev,
      [conversationId]: prev[conversationId]?.map(m => 
        m.id === messageId ? { ...m, important } : m
      ) || []
    }));

    // Broadcast to other tabs
    broadcastToTabs({
      type: 'toggle_important',
      payload: { conversationId, messageId, important }
    });

    // Call API
    const result = await messageService.toggleImportant(messageId, important);
    
    if (result.success) {
      message.success(important ? 'Marked as important' : 'Removed from important');
    } else {
      // Revert on error
      setMessagesMap(prev => ({
        ...prev,
        [conversationId]: prev[conversationId]?.map(m => 
          m.id === messageId ? { ...m, important: !important } : m
        ) || []
      }));
      message.error('Failed to update message');
    }
  }, [chatState.currentConversationId]);

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
      alignItems: 'center',
      gap: 12,
      borderBottom: '1px solid #e5e7eb',
      background: '#ffffff',
    } as React.CSSProperties,
    headerInfo: {
      display: 'flex',
      marginLeft: '20px',
    } as React.CSSProperties,
    headerTitle: {
      margin: 0,
      color: '#9d740cff',
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

  // Handle conversation moved to project
  const handleConversationMoved = useCallback((conversationId: string, projectId: string) => {
    console.log(`✅ Conversation ${conversationId} moved to project ${projectId}`);
    // Reload conversations to reflect the change
    loadConversations({ page: 1, append: false, manageLoading: false });
  }, [loadConversations]);

  // ✅ Handle project update - Refresh project conversations immediately
  const handleProjectUpdate = useCallback(async (projectId: string) => {
    console.log(`🔄 Refreshing project ${projectId} conversations...`);
    if (chatSidebarRef.current) {
      await chatSidebarRef.current.refreshProject(projectId);
    }
  }, []);

  // ✅ Enhanced delete handler - Refresh all projects after deletion
  const handleDeleteWithProjectRefresh = useCallback(async (id: string) => {
    console.log(`🗑️ Deleting conversation ${id}`);

    // Delete conversation
    await handleDeleteConversation(id);

    // Refresh all expanded projects to sync
    console.log('🔄 Refreshing all projects after deletion...');
    if (chatSidebarRef.current) {
      await chatSidebarRef.current.refreshAllProjects();
    }
  }, [handleDeleteConversation]);

  // ✅ Enhanced rename handler - Refresh all projects after rename
  const handleRenameWithProjectRefresh = useCallback(async (id: string, newTitle: string) => {
    console.log(`✏️ Renaming conversation ${id} to "${newTitle}"`);

    // Rename conversation
    await handleRenameConversation(id, newTitle);

    // Refresh all expanded projects to sync
    console.log('🔄 Refreshing all projects after rename...');
    if (chatSidebarRef.current) {
      await chatSidebarRef.current.refreshAllProjects();
    }
  }, [handleRenameConversation]);

  return (
    <DragAndDropProvider 
      onConversationMoved={handleConversationMoved}
      onProjectUpdate={handleProjectUpdate}
    >
      <div style={styles.page}>
      {/* Fixed Sidebar on Left */}
      <div style={styles.sidebar}>
        <ChatSidebar
          ref={chatSidebarRef}
          conversations={chatState.conversations}
          currentConversationId={chatState.currentConversationId}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteWithProjectRefresh}
          onRenameConversation={handleRenameWithProjectRefresh}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
          onOpenSearch={handleOpenSearch}
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
            </div>
            
            {/* Action Buttons + Search Input */}
            {chatState.currentConversationId && (
              <Space size={16} style={{ marginLeft: '50px' }}>
                
                
                {/* ✅ Semantic Search Input - Simple like sidebar search */}
                <div style={{ width: 280 }}>
                  <SemanticChatDrawer
                    conversationId={chatState.currentConversationId}
                    onMessageClick={handleScrollToMessage}
                  />
                </div>
              </Space>
            )}
            <Button
              icon={<StarFilled />}
              onClick={handleOpenImportant}
              style={{
                borderRadius: 8,
                height: 36,
                marginLeft: 'auto',
                marginRight: '50px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#faad14',
                borderColor: '#faad14',
              }}
            >
              Important
            </Button>
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
              onToggleImportant={handleToggleImportant}
            />
          </div>

          <div style={styles.inputContainer}>
            <ChatInput
              ref={chatInputRef}
              onSendMessage={handleSendMessage}
              isLoading={!!finalOperationLoading.type}
              placeholder="Type your message..."
            />
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        visible={searchModalVisible}
        onClose={handleCloseSearch}
        currentUserId={userId}
      />
    
      {/* Important Messages Drawer */}
      <ImportantDrawer
        visible={importantDrawerVisible}
        onClose={handleCloseImportant}
        conversationId={chatState.currentConversationId}
        onMessageClick={handleScrollToMessage}
      />

      {/* ✅ Text Selection Popover - Ask AI about selected text */}
      <SelectionPopover onAskAI={handleAskAIAboutSelection} />
      </div>
    </DragAndDropProvider>
  );
};

export default ChatContainer;
