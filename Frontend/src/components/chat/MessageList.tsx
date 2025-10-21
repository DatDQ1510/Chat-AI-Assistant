import React, { useEffect, useRef } from 'react';
import { Empty, Spin } from 'antd';
import MessageItem from './MessageItem';
import type { Message } from '../../types/chat';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onCopyMessage?: (content: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onRetryMessage?: (messageId: string) => void; // ✅ Retry failed messages
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  onCopyMessage,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  onRetryMessage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollHeightBeforeLoad = useRef(0);

  useEffect(() => {
    if (containerRef.current && !isLoadingMore) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length, isLoadingMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onLoadMore) return;

    console.log('🔧 Setting up scroll listener:', {
      hasMore,
      isLoadingMore,
      messagesCount: messages.length
    });

    const handleScroll = () => {
      console.log('📜 Scroll event:', {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        hasMore,
        isLoadingMore
      });

      if (container.scrollTop <= 10 && hasMore && !isLoadingMore) {
        console.log('🔝 Loading more messages...');
        scrollHeightBeforeLoad.current = container.scrollHeight;
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }, [onLoadMore, hasMore, isLoadingMore, messages.length]);

    useEffect(() => {
      if (containerRef.current && !isLoadingMore && scrollHeightBeforeLoad.current > 0) {
        const newScrollHeight = containerRef.current.scrollHeight;
        containerRef.current.scrollTop = newScrollHeight - scrollHeightBeforeLoad.current;
        scrollHeightBeforeLoad.current = 0;
      }
    }, [messages.length, isLoadingMore]);


  // ✅ Empty UI khi chưa có tin
  if (messages.length === 0 && !isLoading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="Start a conversation" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        paddingRight: 6,
      }}
    >
      {isLoadingMore && (
        <div style={{ textAlign: 'center', padding: 10 }}>
          <Spin size="small" />
        </div>
      )}

      {messages.map((message) => (
        <MessageItem 
          key={message.id} 
          message={message} 
          onCopy={onCopyMessage}
          onRetry={onRetryMessage}
        />
      ))}

      {isLoading && (
        <div style={{ display: 'flex', gap: 10, padding: 12 }}>
          <Spin size="small" /> AI is typing...
        </div>
      )}  
    </div>
  );
};

export default MessageList;
