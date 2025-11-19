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
import ConversationStarters from './ConversationStarters'; // ✅ NEW: Conversation starters
import type { Conversation, ChatState, Message } from '../../types/chat';
import { useAuth } from '../../contexts/AuthContext';
import conversationService from '../../services/conversation.service'; // ✅ Re-enabled for tag updates
import messageService from '../../services/message.service';

// ✅ Search result type
interface SearchResult {
  id: string;
  content: string;
  conversation_id: string;
  conversation_title?: string;
  relevance_score?: number;
  role: 'user' | 'assistant';
  timestamp: Date;
  important?: boolean;
}

interface SearchResultsCache {
  [query: string]: {
    results: SearchResult[];
    timestamp: number;
  };
}

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
  const messageListRef = useRef<HTMLDivElement>(null); // ✅ Ref for MessageList container (selection area)
  
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
    conversation_tag: conv.conversation_tag ?? null, // ✅ Include tag
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

  const finalMessagesMap = messagesMap; // Shared state updated by hooks
  const finalMessagePagination = Object.keys(hookMessagePagination).length > 0 ? hookMessagePagination : messagePagination;
  const finalIsWaitingForAI = hookIsWaitingForAI;
  const finalOperationLoading = hookOperationLoading;
  const finalConversationPagination = hookConversationPagination;

  const currentConversation = useMemo(() => {
    return chatState.conversations.find(c => c.id === chatState.currentConversationId) ?? null;
  }, [chatState.conversations, chatState.currentConversationId]);

  const [searchModalVisible, setSearchModalVisible] = useState(false);

  const [importantDrawerVisible, setImportantDrawerVisible] = useState(false);
  
  const [searchResultsCache, setSearchResultsCache] = useState<SearchResultsCache>({});
  
  const [lastSearchQuery, setLastSearchQuery] = useState('');

  // ✅ Loading state for conversation transitions
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        console.error('Failed to load message:', error);
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

    // ✅ Set selected text in ChatInput preview box (không điền trực tiếp vào input nữa)
    chatInputRef.current?.setSelectedText(selectedText);
    
    // ✅ Focus vào input sau 100ms để user có thể thêm context
    setTimeout(() => {
      chatInputRef.current?.focusInput();
    }, 100);
    
    message.success('📝 Text added to follow-up - Add your question below');
  }, [chatState.currentConversationId]);

  // ✅ Handle suggestion click → Send as message
  const handleSuggestionClick = useCallback((suggestion: string) => {
    if (!chatState.currentConversationId) {
      message.warning('Please select a conversation first');
      return;
    }

    // Send suggestion as a normal message
    handleSendMessage(suggestion);
  }, [chatState.currentConversationId, handleSendMessage]);

  // ✅ Handle generate suggestions for the last AI message
  const handleGenerateSuggestionsForLastMessage = useCallback(() => {
    if (!chatState.currentConversationId || !socket) {
      message.warning('Please select a conversation first');
      return;
    }

    const conversationId = chatState.currentConversationId;
    const messages = messagesMap[conversationId] || [];
    const lastAI = messages.filter(m => m.role === 'assistant').pop();

    if (!lastAI) {
      message.warning('No AI message to generate suggestions for');
      return;
    }

    // Set loading state for this message
    setMessagesMap(prev => ({
      ...prev,
      [conversationId]: prev[conversationId]?.map(m =>
        m.id === lastAI.id ? { ...m, loadingSuggestions: true } : m
      ) || []
    }));

    // Emit socket event to generate suggestions
    socket.emit('generate_suggestions', {
      conversation_id: conversationId,
      message_id: lastAI.id,
    });

    message.loading('Generating suggestions...', 1.5);
  }, [chatState.currentConversationId, socket, messagesMap]);

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

  // ✅ CRITICAL: Sync currentConversationId with URL chatId immediately to prevent flicker
  // This must run BEFORE any other effects to ensure UI shows correct conversation
  useEffect(() => {
    if (!chatId) {
      // No chatId in URL, clear current conversation
      setChatState(prev => ({
        ...prev,
        currentConversationId: null,
      }));
      setIsTransitioning(false);
      return;
    }

    // If chatId changed, immediately update currentConversationId to prevent showing old conversation
    if (chatState.currentConversationId !== chatId) {
      setChatState(prev => ({
        ...prev,
        currentConversationId: chatId,
      }));
    }
  }, [chatId, chatState.currentConversationId, setChatState]);

  // ✅ Handle conversation transitions with loading state
  useEffect(() => {
    // Don't show transition loading if there's an operation in progress
    if (finalOperationLoading.type) {
      setIsTransitioning(false);
      return;
    }

    if (!chatId) {
      setIsTransitioning(false);
      return;
    }

    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // Always show loading when chatId changes (except first mount)
    const prevChatId = chatState.currentConversationId;
    const isSwitching = prevChatId && prevChatId !== chatId;
    
    if (!isSwitching) {
      // Not switching, just first load
      setIsTransitioning(false);
      return;
    }

    // We're switching - show loading overlay
    setIsTransitioning(true);

    // Check if messages are already loaded
    const hasMessages = messagesMap[chatId] && messagesMap[chatId].length > 0;
    
    if (hasMessages) {
      // Messages already cached, hide loading quickly
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
    } else {
      // No messages yet, wait for them to load (with max timeout)
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 1000);
    }

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [chatId, chatState.currentConversationId, messagesMap, finalOperationLoading.type]);

  // ✅ Hide transition loading when messages arrive
  useEffect(() => {
    if (!chatId || !isTransitioning || finalOperationLoading.type) return;
    
    const hasMessages = messagesMap[chatId] && messagesMap[chatId].length > 0;
    
    if (hasMessages) {
      // Messages loaded, hide loading after brief delay for smooth transition
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [chatId, messagesMap, isTransitioning, finalOperationLoading.type]);

  // ✅ Load conversation metadata if not in list (for project conversations)
  useEffect(() => {
    if (!chatId) return;
    
    // Check if conversation exists in loaded conversations
    const existsInRegular = chatState.conversations.some(c => c.id === chatId);
    
    if (existsInRegular) {
      // Conversation already in list, no need to load
      return;
    }
    
    // Conversation not in regular list, might be project conversation
    // Load it directly without adding to regular conversations list
    let cancelled = false;
    
    const loadProjectConversation = async () => {
      try {
        const res = await conversationService.getConversation(chatId);
        
        // Check if request was cancelled (user navigated away)
        if (cancelled) return;
        
        const conv = normalizeConversation(res);

        // Check if it has project_id
        if (!conv.project_id) {
          // Regular conversation not yet loaded, add to list
          setChatState(prev => ({
            ...prev,
            conversations: [conv, ...prev.conversations],
          }));
        }
        // For project conversations, currentConversationId already set
      } catch (err) {
        if (cancelled) return;
        
        console.error('Failed to load conversation:', err);
        message.error('Failed to load conversation');
        // Navigate away from invalid conversation
        navigate('/chat', { replace: true });
        // Clear currentConversationId
        setChatState(prev => ({
          ...prev,
          currentConversationId: null,
        }));
      }
    };
    
    loadProjectConversation();
    
    return () => {
      cancelled = true; // Cancel if effect cleanup runs (user navigated away)
    };
  }, [chatId, chatState.conversations, normalizeConversation, setChatState, navigate]);

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
    

    return messages;
  }, [chatState.currentConversationId, finalMessagesMap]);
  
  // ✅ Calculate last AI message for suggestions button in ChatInput
  const lastAIMessage = useMemo(() => {
    const assistantMessages = currentMessages.filter(m => m.role === 'assistant');
    return assistantMessages.length > 0 
      ? assistantMessages[assistantMessages.length - 1] 
      : undefined;
  }, [currentMessages]);
  
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
  const handleConversationMoved = useCallback(async () => {
    // Reload conversations to reflect the change
    await loadConversations({ page: 1, append: false, manageLoading: false });
  }, [loadConversations]);

  // ✅ Handle project update - Refresh project conversations immediately
  const handleProjectUpdate = useCallback(async (projectId: string) => {

    if (chatSidebarRef.current) {
      await chatSidebarRef.current.refreshProject(projectId);
    }
  }, []);

  // ✅ Enhanced delete handler - Refresh all projects after deletion
  const handleDeleteWithProjectRefresh = useCallback(async (id: string) => {


    // Delete conversation
    await handleDeleteConversation(id);

    // Refresh all expanded projects to sync

    if (chatSidebarRef.current) {
      await chatSidebarRef.current.refreshAllProjects();
    }
  }, [handleDeleteConversation]);

  // ✅ Enhanced rename handler - Refresh all projects after rename
  const handleRenameWithProjectRefresh = useCallback(async (id: string, newTitle: string) => {


    // Rename conversation
    await handleRenameConversation(id, newTitle);

    // Reload conversations to update order (updatedAt changed on backend)

    await loadConversations({ page: 1, append: false, manageLoading: false });

    // Refresh all expanded projects to sync

    if (chatSidebarRef.current) {
      await chatSidebarRef.current.refreshAllProjects();
    }
  }, [handleRenameConversation, loadConversations]);

  // ✅ Update conversation tag handler - Refresh all projects after tag update
  const handleUpdateTag = useCallback(async (id: string, tag: string | null) => {


    try {
      // Update tag via API
      await conversationService.updateConversationTag(id, tag);

      // Reload conversations to sync
      await loadConversations({ page: 1, append: false, manageLoading: false });

      // Refresh all expanded projects to sync

      if (chatSidebarRef.current) {
        await chatSidebarRef.current.refreshAllProjects();
      }

      message.success(tag ? `Tagged as "${tag}"` : 'Tag removed');
    } catch (error) {
      console.error('Failed to update tag:', error);
      message.error('Failed to update tag');
    }
  }, [loadConversations]);

  // ✅ Refresh all expanded projects
  const handleRefreshAllProjects = useCallback(async () => {

    if (chatSidebarRef.current) {
      await chatSidebarRef.current.refreshAllProjects();
    }
  }, []);

  return (
    <DragAndDropProvider 
      onConversationMoved={handleConversationMoved}
      onProjectUpdate={handleProjectUpdate}
      onRefreshAllProjects={handleRefreshAllProjects}
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
          onUpdateTag={handleUpdateTag}
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
          {/* ✅ Loading overlay for operations AND conversation transitions */}
          {(finalOperationLoading.type || isTransitioning) && (
            <div style={styles.loadingOverlay}>
              <Spin
                size="large"
                indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />}
                tip={isTransitioning ? "Loading conversation..." : undefined}
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

          <div style={styles.messages} ref={messageListRef}>
            <MessageList
              messages={currentMessages}
              isLoading={finalIsWaitingForAI}
              onCopyMessage={hookHandleCopyMessage}
              onLoadMore={handleLoadMoreMessages}
              hasMore={chatState.currentConversationId ? finalMessagePagination[chatState.currentConversationId]?.hasMore : false}
              isLoadingMore={chatState.currentConversationId ? finalMessagePagination[chatState.currentConversationId]?.isLoading : false}
              onRetryMessage={handleRetryMessage}
              onToggleImportant={handleToggleImportant}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>

          <div style={styles.inputContainer}>
            
            {/* ✅ Conversation Starters - shown above input when conversation has few/no messages */}
            { chatState.currentConversationId && currentMessages.length <= 2 && (
              <ConversationStarters
                socket={socket}
                conversationId={chatState.currentConversationId}
                onStarterClick={handleSendMessage}
                isLoading={!!finalOperationLoading.type || finalIsWaitingForAI}
              />
            )}
          

            <ChatInput
              ref={chatInputRef}
              onSendMessage={handleSendMessage}
              isLoading={!!finalOperationLoading.type}
              placeholder="Type your message..."
              onGenerateSuggestions={handleGenerateSuggestionsForLastMessage} // ✅ Pass callback
              lastAIMessage={lastAIMessage} // ✅ Pass last AI message for button state
            />
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        visible={searchModalVisible}
        onClose={handleCloseSearch}
        currentUserId={userId}
        searchResultsCache={searchResultsCache}
        onUpdateCache={setSearchResultsCache}
        lastSearchQuery={lastSearchQuery}
        onUpdateLastQuery={setLastSearchQuery}
      />
    
      {/* Important Messages Drawer */}
      <ImportantDrawer
        visible={importantDrawerVisible}
        onClose={handleCloseImportant}
        conversationId={chatState.currentConversationId}
        onMessageClick={handleScrollToMessage}
        onToggleImportant={handleToggleImportant}
      />

      {/* ✅ Text Selection Popover - Ask AI about selected text (only in MessageList area) */}
      <SelectionPopover 
        onAskAI={handleAskAIAboutSelection}
        containerRef={messageListRef}
      />
      </div>
    </DragAndDropProvider>
  );
};

export default ChatContainer;
