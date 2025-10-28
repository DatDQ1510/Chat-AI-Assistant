import { useEffect, useRef } from 'react';
import { message as antMessage } from 'antd';
import { Socket } from 'socket.io-client';
import { formatMessage } from '../utils/chat';
import { broadcastToTabs } from '../utils/tabSync';
import type { Message, ChatState } from '../types/chat';

interface UseSocketEventsProps {
  socket: Socket | null;
  currentConversationId: string | null;
  setMessagesMap: React.Dispatch<React.SetStateAction<{ [conversationId: string]: Message[] }>>;
  setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
  setIsWaitingForAI: React.Dispatch<React.SetStateAction<boolean>>;
  refreshConversationOrder?: () => void; // ✅ Simple refresh callback
}

export const useSocketEvents = ({
  socket,
  currentConversationId,
  setMessagesMap,
  setChatState,
  setIsWaitingForAI,
  refreshConversationOrder, // ✅ Accept callback
}: UseSocketEventsProps) => {
  const aiResponseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentAIMessageRef = useRef<{ id: string; conversationId: string } | null>(null);

  useEffect(() => {
    if (!socket) return;

    console.log("🔌 useSocketEvents mounted", { 
      hasRefreshCallback: !!refreshConversationOrder,
      currentConversationId 
    });

    // Join conversation room
    if (currentConversationId) {
      socket.emit("join_conversation", currentConversationId);
    }

    // Handle receive_message
    socket.on("receive_message", (msg, callback) => {
      console.log("📨 Received message:", msg);
      const formattedMsg = formatMessage(msg);
      const convId = msg.conversation_id;

      setMessagesMap(prev => {
        const currentMessages = prev[convId] || [];
        
        const existsById = currentMessages.some(m => m.id === msg.id);
        if (existsById) {
          console.log("⛔ Duplicate message (by ID), skipping");
          return prev;
        }

        const tempIndex = currentMessages.findIndex(m => 
          m.isTemp && 
          m.content === formattedMsg.content && 
          m.role === formattedMsg.role
        );

        if (tempIndex !== -1) {
          console.log("🔄 Replacing temp message with real one");
          const updated = [...currentMessages];
          updated[tempIndex] = { ...formattedMsg, isTemp: false };
          return { ...prev, [convId]: updated };
        } else {
          console.log("➕ Adding new message");
          return { ...prev, [convId]: [...currentMessages, formattedMsg] };
        }
      });

      if (callback) {
        callback({ received: true, messageId: msg.id });
      }
    });

    // ✅ Handle user_message_saved - Replace temp user message with real saved one
    socket.on("user_message_saved", (savedMessage) => {
      console.log("💾 User message saved:", savedMessage);
      const convId = savedMessage.conversation_id;
      
      setMessagesMap(prev => {
        const currentMessages = prev[convId] || [];
        
        // Find temp message with matching content
        const tempIndex = currentMessages.findIndex(m => 
          m.isTemp && 
          m.role === 'user' &&
          m.content === savedMessage.content &&
          m.status === 'sending'
        );

        if (tempIndex !== -1) {
          console.log("🔄 Replacing temp user message with saved one");
          const updated = [...currentMessages];
          updated[tempIndex] = {
            id: savedMessage.id,
            role: 'user',
            content: savedMessage.content,
            timestamp: new Date(savedMessage.createdAt),
            status: 'sent' as const,
            isTemp: false,
            attachments: savedMessage.attachments,
          };

          return { ...prev, [convId]: updated };
        } else {
          // If no temp message found, add as new (shouldn't happen normally)
          console.log("➕ Adding saved user message");

          return { 
            ...prev, 
            [convId]: [
              ...currentMessages, 
              {
                id: savedMessage.id,
                role: 'user' as const,
                content: savedMessage.content,
                timestamp: new Date(savedMessage.createdAt),
                status: 'sent' as const,
                isTemp: false,
                attachments: savedMessage.attachments,
              }
            ] 
          };
        }
      });

      // ✅ Refresh conversation order AFTER state update
      console.log("🔄 Triggering conversation order refresh after user message saved...");
      if (refreshConversationOrder) {
        refreshConversationOrder();
      }

      // Broadcast to other tabs
      broadcastToTabs({
        type: 'update_message',
        payload: {
          conversationId: convId,
          messageId: savedMessage.id,
          updates: { 
            id: savedMessage.id,
            status: 'sent' as const, 
            isTemp: false 
          }
        }
      });
    });

    // Handle ai_message_init
    socket.on("ai_message_init", (aiMessage) => {
      console.log("🤖 AI init:", aiMessage);
      setIsWaitingForAI(false);
      setChatState(prev => ({ ...prev, isStreaming: true }));

      const convId = aiMessage.conversation_id;
      
      setMessagesMap(prev => ({
        ...prev,
        [convId]: (prev[convId] || []).map(m =>
          m.role === 'user' && m.isTemp && m.status === 'sending'
            ? { ...m, status: 'sent' as const, isTemp: false }
            : m
        )
      }));
      
      broadcastToTabs({
        type: 'update_message',
        payload: {
          conversationId: convId,
          messageId: '',
          updates: { status: 'sent' as const, isTemp: false }
        }
      });
      
      currentAIMessageRef.current = {
        id: aiMessage.id,
        conversationId: convId,
      };

      if (aiResponseTimeoutRef.current) {
        clearTimeout(aiResponseTimeoutRef.current);
      }

      aiResponseTimeoutRef.current = setTimeout(() => {
        console.error("⏰ AI response timeout!");
        setIsWaitingForAI(false);
        setChatState(prev => ({ ...prev, isStreaming: false }));

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

        broadcastToTabs({
          type: 'ai_error',
          payload: {
            conversationId: convId,
            messageId: aiMessage.id,
            error: 'AI response timeout. Please try again.'
          }
        });

        antMessage.error("AI response timeout. Please try sending your message again.");
        currentAIMessageRef.current = null;
      }, 60000);

      const aiMsg = {
        id: aiMessage.id,
        role: "assistant" as const,
        content: "",
        isStreaming: true,
        timestamp: new Date(),
      };

      setMessagesMap(prev => ({
        ...prev,
        [convId]: [...(prev[convId] || []), aiMsg],
      }));

      broadcastToTabs({
        type: 'ai_message_init',
        payload: { conversationId: convId, message: aiMsg }
      });

      broadcastToTabs({
        type: 'streaming_status',
        payload: { isStreaming: true, isWaitingForAI: false }
      });
    });

    // Handle ai_stream
    socket.on("ai_stream", ({ message_id, chunk, conversation_id }) => {
      setMessagesMap(prev => ({
        ...prev,
        [conversation_id]: (prev[conversation_id] || []).map(m =>
          m.id === message_id ? { ...m, content: (m.content || "") + chunk } : m
        ),
      }));

      broadcastToTabs({
        type: 'ai_stream_chunk',
        payload: { conversationId: conversation_id, messageId: message_id, chunk }
      });
    });

    // Handle ai_stream_end
    socket.on("ai_stream_end", ({ message_id, real_message_id, full_content, conversation_id }) => {
      console.log("✅ AI finished:", message_id, "→ real ID:", real_message_id);
      
      if (aiResponseTimeoutRef.current) {
        clearTimeout(aiResponseTimeoutRef.current);
        aiResponseTimeoutRef.current = null;
      }
      
      currentAIMessageRef.current = null;
      setIsWaitingForAI(false);
      setChatState(prev => ({ ...prev, isStreaming: false }));

      setMessagesMap(prev => {
        const updated = { ...prev };
        
        if (conversation_id && updated[conversation_id]) {
          updated[conversation_id] = updated[conversation_id].map(m =>
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
        } else {
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

      // ✅ Refresh conversation order with AI response
      console.log("🔄 AI stream ended, checking refresh callback...", { 
        hasCallback: !!refreshConversationOrder, 
        conversationId: conversation_id 
      });
      if (refreshConversationOrder && conversation_id) {
        console.log("🔄 Triggering conversation order refresh after AI response...");
        refreshConversationOrder();
      }

      broadcastToTabs({
        type: 'ai_stream_end',
        payload: {
          conversationId: conversation_id,
          messageId: message_id,
          realMessageId: real_message_id || message_id,
          fullContent: full_content
        }
      });

      broadcastToTabs({
        type: 'streaming_status',
        payload: { isStreaming: false, isWaitingForAI: false }
      });
    });

    // ✅ Handle conversation_list_updated - Refresh conversation list
    socket.on("conversation_list_updated", ({ conversation_id, action, timestamp }) => {
      console.log(`📢 Conversation list updated: ${conversation_id} - ${action} at ${timestamp}`);
      console.log("📢 Checking refresh callback...", { hasCallback: !!refreshConversationOrder });
      
      // Trigger refresh
      if (refreshConversationOrder) {
        console.log("📢 Calling refreshConversationOrder from conversation_list_updated event");
        refreshConversationOrder();
      } else {
        console.error("❌ refreshConversationOrder callback is missing!");
      }

      // Broadcast to other tabs
      broadcastToTabs({
        type: 'refresh_conversations',
        payload: {},
      });
    });

    // Handle ai_error
    socket.on("ai_error", ({ message_id, conversation_id, error, errorCode }) => {
      console.error("❌ AI error:", error, "Code:", errorCode);
      
      if (aiResponseTimeoutRef.current) {
        clearTimeout(aiResponseTimeoutRef.current);
        aiResponseTimeoutRef.current = null;
      }
      
      currentAIMessageRef.current = null;
      setIsWaitingForAI(false);
      setChatState(prev => ({ ...prev, isStreaming: false }));

      const errorMsg = error || 'AI service temporarily unavailable';

      setMessagesMap(prev => {
        const messages = prev[conversation_id] || [];
        const aiMessageExists = messages.some(m => m.id === message_id);
        
        if (aiMessageExists) {
          return {
            ...prev,
            [conversation_id]: messages.map(m =>
              m.id === message_id
                ? { 
                    ...m, 
                    content: `⚠️ ${errorMsg}`,
                    isStreaming: false,
                    status: 'error' as const
                  }
                : m
            )
          };
        } else {
          return prev;
        }
      });

      broadcastToTabs({
        type: 'ai_error',
        payload: { conversationId: conversation_id, messageId: message_id, error: errorMsg }
      });

      broadcastToTabs({
        type: 'streaming_status',
        payload: { isStreaming: false, isWaitingForAI: false }
      });

      antMessage.error(errorMsg);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.warn("⚠️ Socket disconnected");
      
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
        
        antMessage.error("Connection to AI lost. Please check your network and try again.");
        currentAIMessageRef.current = null;
      } else {
        antMessage.warning("Socket disconnected. Attempting to reconnect...");
      }
      
      if (aiResponseTimeoutRef.current) {
        clearTimeout(aiResponseTimeoutRef.current);
        aiResponseTimeoutRef.current = null;
      }
    });

    // Handle reconnect
    socket.on("connect", () => {
      console.log("✅ Socket reconnected");
      
      if (currentConversationId) {
        socket.emit("join_conversation", currentConversationId);
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_message_saved"); // ✅ Cleanup new event
      socket.off("ai_message_init");
      socket.off("ai_stream");
      socket.off("ai_stream_end");
      socket.off("ai_error");
      socket.off("conversation_list_updated"); // ✅ Cleanup
      socket.off("disconnect");
      socket.off("connect");
      
      if (aiResponseTimeoutRef.current) {
        clearTimeout(aiResponseTimeoutRef.current);
      }
    };
  }, [socket, currentConversationId, setMessagesMap, setChatState, setIsWaitingForAI, refreshConversationOrder]);

  return { aiResponseTimeoutRef, currentAIMessageRef };
};
