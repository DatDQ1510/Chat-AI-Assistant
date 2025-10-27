import React, { useState, useEffect } from 'react';
import { Modal, List, Typography, Empty, Spin, Space, Tag } from 'antd';
import { StarFilled, ClockCircleOutlined, UserOutlined, RobotOutlined, CloseOutlined } from '@ant-design/icons';
import type { Message } from '../../types/chat';
import messageService from '../../services/message.service';
import { chatChannel } from '../../utils/tabSync';

const { Text, Paragraph } = Typography;

interface ImportantDrawerProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string | null;
  onMessageClick?: (messageId: string) => void;
}

const ImportantDrawer: React.FC<ImportantDrawerProps> = ({
  visible,
  onClose,
  conversationId,
  onMessageClick,
}) => {
  const [importantMessages, setImportantMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchImportantMessages = async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const messages = await messageService.getImportantMessages(conversationId);
      setImportantMessages(messages);
    } catch (error) {
      console.error('Failed to fetch important messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && conversationId) {
      fetchImportantMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, conversationId]);

  // Listen for real-time important toggle events
  useEffect(() => {
    const handleTabSync = (event: MessageEvent) => {
      const { type, payload } = event.data;
      
      if (type === 'toggle_important' && payload.conversationId === conversationId) {
        // Update local state
        setImportantMessages(prev => {
          if (payload.important) {
            // Message marked as important - add if not already in list
            const exists = prev.some(m => m.id === payload.messageId);
            if (!exists) {
              // Refetch to get the full message data
              fetchImportantMessages();
            }
            return prev;
          } else {
            // Message unmarked - remove from list
            return prev.filter(m => m.id !== payload.messageId);
          }
        });
      }
    };

    chatChannel.addEventListener('message', handleTabSync);
    return () => chatChannel.removeEventListener('message', handleTabSync);
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
    });
  };

  // Substring content to ~100 words (approximately 600 characters)
  const truncateContent = (content: string, maxChars: number = 200): string => {
    if (content.length <= maxChars) return content;
    return content.substring(0, maxChars) + '...';
  };

  // ✅ Show ALL important messages, not just 5
  const displayMessages = importantMessages;

  return (
    <Modal
      title={
        <Space style={{ width: '100%' }}>
          <Space>
            <StarFilled style={{ color: '#faad14', fontSize: 20 }} />
            <Text strong style={{ fontSize: 20 }}>Important Messages</Text>
          </Space>
          <Tag color="gold" style={{ marginLeft: 'auto', fontSize: 20 }}>{importantMessages.length}</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      closeIcon={<CloseOutlined />}
      styles={{
        body: { 
          padding: 0,
          maxHeight: '400px',
          overflowY: 'auto',

        },
      }}
    >
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '48px 12px',
        }}>
          <Spin size="large" tip="Loading..." />
        </div>
      ) : importantMessages.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                No important messages
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Star messages to mark them
              </Text>
            </Space>
          }
          style={{ padding: '40px 20px' }}
        />
      ) : (
        <List
          dataSource={displayMessages}
          renderItem={(message) => (
            <List.Item
              key={message.id}
              onClick={() => {
                onMessageClick?.(message.id);
                onClose(); // Close modal after click
              }}
              style={{
                cursor: 'pointer',
                padding: '12px 16px',
                background: 'white',
                borderBottom: '1px solid #f0f0f0',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f5f7fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              <div style={{ width: '100%' }}>
                {/* Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 8,
                }}>
                  <Space size={6}>
                    {message.role === 'user' ? (
                      <Tag color="blue" icon={<UserOutlined />} style={{ fontSize: 10, padding: '0 4px' }}>
                        You
                      </Tag>
                    ) : (
                      <Tag color="green" icon={<RobotOutlined />} style={{ fontSize: 10, padding: '0 4px' }}>
                        AI
                      </Tag>
                    )}
                    <StarFilled style={{ color: '#faad14', fontSize: 11 }} />
                  </Space>
                  <Space size={3} style={{ color: '#8c8c8c' }}>
                    <ClockCircleOutlined style={{ fontSize: 10 }} />
                    <Text type="secondary" style={{ fontSize: 10 }}>
                      {formatTimestamp(message.timestamp)}
                    </Text>
                  </Space>
                </div>

                {/* Content - Truncated to ~100 words */}
                <Paragraph
                  style={{
                    margin: 0,
                    color: '#262626',
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  {truncateContent(message.content)}
                </Paragraph>

                {/* Attachments indicator */}
                {message.attachments && message.attachments.length > 0 && (
                  <Text type="secondary" style={{ fontSize: 10, marginTop: 4, display: 'block' }}>
                    📎 {message.attachments.length} file(s)
                  </Text>
                )}
              </div>
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
};

export default ImportantDrawer;
