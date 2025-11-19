import { useState, useCallback } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import conversationService from '../services/conversation.service';
import { broadcastToTabs } from '../utils/tabSync';
import type { Conversation, ChatState } from '../types/chat';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConversation = any;

interface UseConversationsProps {
  chatState: ChatState;
  setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
  userId: string | null;
  normalizeConversation: (conv: AnyConversation) => Conversation;
}

export const useConversations = ({
  chatState,
  setChatState,
  userId,
  normalizeConversation,
}: UseConversationsProps) => {
  const navigate = useNavigate();
  
  const [conversationPagination, setConversationPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    isLoading: false,
    hasMore: true,
  });

  const [operationLoading, setOperationLoading] = useState<{
    type: 'create' | 'delete' | 'rename' | 'load' | null;
    conversationId?: string;
  }>({ type: null });

  // Load conversations
  const loadConversations = useCallback(async (opts: { 
    signal?: AbortSignal; 
    selectConversationId?: string | null; 
    manageLoading?: boolean; 
    page?: number; 
    append?: boolean 
  } = {}) => {
    const { signal, selectConversationId = null, manageLoading = true, page = 1, append = false } = opts;

    setChatState(prev => ({ ...prev, isLoading: manageLoading ? true : prev.isLoading }));

    if (append) {
      setConversationPagination(prev => ({ ...prev, isLoading: true }));
    }

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


      const normalized = rawConversations.map((c: AnyConversation) => normalizeConversation(c));



      setChatState(prev => {
        let updatedConversations;
        if (append) {
          const existingIds = new Set(prev.conversations.map(c => c.id));
          const newConversations = normalized.filter(c => !existingIds.has(c.id));
          updatedConversations = [...prev.conversations, ...newConversations];
        } else {
          updatedConversations = normalized;
        }

        const prevCurrent = prev.currentConversationId;
        const preferred = selectConversationId ?? prevCurrent;
        const targetId = preferred && updatedConversations.some((c: Conversation) => c.id === preferred)
          ? preferred
          : (updatedConversations[0]?.id ?? null);

        return {
          ...prev,
          conversations: updatedConversations,
          currentConversationId: targetId,
          isLoading: false,
        };
      });

      setConversationPagination({
        currentPage: page,
        totalPages,
        isLoading: false,
        hasMore: page < totalPages,
      });
    } catch (err) {
      if (signal?.aborted) return;
      console.error('Failed to load conversations:', err);

      message.error('Could not load conversations from server.');
      setChatState({
        conversations: [],
        currentConversationId: null,
        isLoading: false,
        isStreaming: false,
      });
      setConversationPagination({ currentPage: 1, totalPages: 1, isLoading: false, hasMore: false });
    }
  }, [userId, normalizeConversation, setChatState, setConversationPagination]);

  // Create new conversation
  const handleNewConversation = useCallback(async () => {
    setOperationLoading({ type: 'create' });
    const hide = message.loading('Creating conversation...', 0);
    try {
      const res = await conversationService.createConversation('New Chat');
      const conv = normalizeConversation(res);
      const newConvId = conv.id;

      // First navigate to trigger UI update
      navigate(`/chat/${newConvId}`);
      
      // Then load conversations with the new one selected
      await loadConversations({ page: 1, append: false, selectConversationId: newConvId });

      broadcastToTabs({
        type: 'new_conversation',
        payload: { conversation: conv }
      });

      hide();
      message.success('New conversation created');
      
      // Add small delay before hiding loading to ensure smooth transition
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {
      hide();
      console.error('Failed to create conversation:', err);
      message.error('Failed to create conversation');
    } finally {
      setOperationLoading({ type: null });
    }
  }, [loadConversations, navigate, normalizeConversation]);

  // Select conversation
  const handleSelectConversation = useCallback(async (id: string) => {
    // ✅ CRITICAL: Navigate first, this triggers URL change and all effects will sync
    navigate(`/chat/${id}`);
    
    // ✅ Note: Do NOT update currentConversationId here!
    // Let the ChatContainer useEffect handle it based on chatId from URL
    // This prevents double state updates and race conditions
    
    // Check if conversation exists in list
    const exists = chatState.conversations.some(c => c.id === id);
    
    if (exists) {
      // Conversation already in list, navigation will handle the rest
      return;
    }

    // Conversation doesn't exist, load it in background
    // (metadata only, messages will be loaded by useMessages hook)
    try {
      const res = await conversationService.getConversation(id);
      const conv = normalizeConversation(res);

      // Only add to conversations list if it's NOT a project conversation
      if (!conv.project_id) {
        setChatState(prev => ({
          ...prev,
          conversations: [conv, ...prev.conversations],
        }));
      }
      // For project conversations, don't add to main list
      // currentConversationId will be set by ChatContainer effect
    } catch (err) {
      console.error('Failed to load conversation:', err);
      message.error('Failed to load conversation');
    }
  }, [chatState.conversations, normalizeConversation, navigate, setChatState]);

  // Delete conversation
  const handleDeleteConversation = useCallback(async (id: string) => {
    setOperationLoading({ type: 'delete', conversationId: id });
    const hide = message.loading('Deleting conversation...', 0);

    try {
      await conversationService.deleteConversation(id);

      const remaining = chatState.conversations.filter(c => c.id !== id);
      const newCurrentId = chatState.currentConversationId === id 
        ? (remaining[0]?.id ?? null) 
        : chatState.currentConversationId;

      // Update state immediately
      setChatState(prev => ({
        ...prev,
        conversations: remaining,
        currentConversationId: newCurrentId,
      }));

      // Navigate if deleted current conversation
      if (chatState.currentConversationId === id) {
        if (newCurrentId) {
          navigate(`/chat/${newCurrentId}`, { replace: true });
        } else {
          navigate('/chat', { replace: true });
        }
      }

      // ✅ Don't reload conversations, we already updated state
      // await loadConversations({ page: 1, append: false, selectConversationId: newCurrentId });

      broadcastToTabs({
        type: 'delete_conversation',
        payload: { conversationId: id }
      });

      hide();
      message.success('Conversation deleted');
    } catch (err) {
      hide();
      console.error('Failed to delete conversation:', err);
      message.error('Failed to delete conversation');
    } finally {
      setOperationLoading({ type: null });
    }
  }, [chatState.conversations, chatState.currentConversationId, navigate, setChatState]);

  // Rename conversation
  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    setOperationLoading({ type: 'rename', conversationId: id });
    const hide = message.loading('Renaming conversation...', 0);

    try {
      await conversationService.renameConversation(id, newTitle);

      setChatState(prev => ({
        ...prev,
        conversations: prev.conversations.map(c => c.id === id ? { ...c, title: newTitle, updatedAt: new Date() } : c),
      }));

      broadcastToTabs({
        type: 'rename_conversation',
        payload: { conversationId: id, newTitle }
      });

      hide();
      message.success('Conversation renamed');
    } catch (err) {
      hide();
      console.error('Failed to rename conversation:', err);
      message.error('Failed to rename conversation');
    } finally {
      setOperationLoading({ type: null });
    }
  }, [setChatState]);

  // Load more conversations
  const handleLoadMoreConversations = useCallback(async () => {
    if (conversationPagination.isLoading || !conversationPagination.hasMore) return;

    const nextPage = conversationPagination.currentPage + 1;

    
    await loadConversations({ page: nextPage, append: true, manageLoading: false });
  }, [conversationPagination, loadConversations]);

  return {
    conversationPagination,
    operationLoading,
    loadConversations,
    handleNewConversation,
    handleSelectConversation,
    handleDeleteConversation,
    handleRenameConversation,
    handleLoadMoreConversations,
  };
};
