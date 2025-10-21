import React, { useMemo } from 'react';
import { Button, Typography, Tooltip, Spin } from 'antd';
import { CopyOutlined, UserOutlined, RobotOutlined, ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { MessageProps } from '../../types/chat';

const { Text } = Typography;

const MessageItem: React.FC<MessageProps> = ({ message: msg, onCopy, onRetry }) => {
  console.log("Rendering MessageItem:", msg);
  const isUser = msg.role === 'user';

  const styles = useMemo(() => {
    return {
      container: {
        display: 'flex',
        gap: 12,
        padding: '12px 0',
        animation: 'fadeIn 0.3s ease-in',
        flexDirection: isUser ? 'row-reverse' : 'row', // ✅ User bên phải, AI bên trái
        // justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
        marginLeft: isUser ? 'auto' : 0, 
      } as React.CSSProperties,
      avatar: {
        width: 36,
        height: 36,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isUser ? '#0284c7' : '#6b7280',
        color: '#ffffff',
        fontSize: 22,
        flexShrink: 0,
      } as React.CSSProperties,
      content: {
        maxWidth: '70%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: isUser ? 'flex-end' : 'flex-start',
        // alignSelf: isUser ? 'flex-end' : 'flex-start', // ✅ Căn lề
      } as React.CSSProperties,
      header: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexDirection: isUser ? 'row-reverse' : 'row',
      } as React.CSSProperties,
      sender: {
        fontWeight: 600,
        fontSize: 18,
        color: '#6b7280',
      } as React.CSSProperties,
      timestamp: {
        fontSize: 16,
        color: '#9ca3af',
      } as React.CSSProperties,
      bubble: {
        backgroundColor: isUser ? '#0284c7' : '#f3f4f6', // ✅ User xanh, AI xám
        color: isUser ? '#ffffff' : '#1f2937',
        borderRadius: 16,
        padding: '12px 16px',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontSize: 22,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        maxWidth: '100%',
      } as React.CSSProperties,
      actions: {
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginTop: 4,
        gap: 8,
      } as React.CSSProperties,
    };
  }, [isUser]);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      message.success('Message copied to clipboard');
      onCopy?.(msg.content);
    } catch {
      message.error('Failed to copy message');
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(timestamp);
  };

  return (
    <div style={styles.container}>
      <div style={styles.avatar}>
        {isUser ? (
          <UserOutlined />
        ) : (
          <RobotOutlined />
        )}
      </div>
      
      <div style={styles.content}>
        <div style={styles.header}>
          <Text style={styles.sender}>
            {isUser ? 'You' : 'AI Assistant'}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(msg.timestamp)}
          </Text>
        </div>
        
        <div style={styles.bubble}>
          <Text style={{ color: isUser ? '#ffffff' : '#1f2937' }}>
            {msg.content}
          </Text>
          {msg.isStreaming && (
            <span style={{ 
              marginLeft: 6, 
              animation: 'blink 1s infinite',
              fontSize: 18,
              color: '#0284c7'
            }}>●</span>
          )}
          {/* ✅ Show error indicator in bubble for failed messages */}
          {msg.status === 'error' && msg.content.includes('⚠️') && (
            <div style={{ 
              marginTop: 8, 
              padding: '8px 12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 8,
              borderLeft: '3px solid #ef4444',
              fontSize: 14
            }}>
              <ExclamationCircleOutlined style={{ color: '#ef4444', marginRight: 6 }} />
              <Text style={{ color: '#ef4444', fontSize: 14 }}>
                {msg.role === 'assistant' ? 'AI connection failed' : 'Message send failed'}
              </Text>
            </div>
          )}
        </div>
        
        <div style={styles.actions}>
          {/* ✅ Status indicators for user messages */}
          {isUser && msg.status === 'sending' && (
            <Tooltip title={`Sending... (Attempt ${msg.retryCount || 1})`}>
              <Spin size="default" style={{ marginRight: 8 }} />
            </Tooltip>
          )}
          
          {isUser && msg.status === 'sent' && (
            <Tooltip title="Sent">
              <CheckCircleOutlined style={{ color: '#10b981', fontSize: 17, marginRight: 8 }} />
            </Tooltip>
          )}
          
          {/* ✅ Error indicator for any message (user or AI) */}
          {msg.status === 'error' && (
            <Tooltip title="Failed to send/receive">
              <ExclamationCircleOutlined style={{ color: '#ef4444', fontSize: 17, marginRight: 8 }} />
            </Tooltip>
          )}

          {/* ✅ Retry button for failed messages (user or AI) */}
          {msg.status === 'error' && onRetry && (
            <Tooltip title={isUser ? "Retry sending message" : "Retry AI response"}>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => onRetry(msg.id)}
                style={{ 
                  color: '#ef4444',
                  fontSize: 18
                }}
              />
            </Tooltip>
          )}

          {/* ✅ Copy button for all messages */}
          <Tooltip title="Copy message">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              style={{ 
                color: '#6b7280',
                fontSize: 18
              }}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;