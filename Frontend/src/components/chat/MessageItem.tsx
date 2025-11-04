import React, { useMemo } from 'react';
import { Button, Typography, Tooltip, Spin, Image, Space } from 'antd';
import { CopyOutlined, UserOutlined, RobotOutlined, ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, StarOutlined, StarFilled, FileOutlined, FilePdfOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { MessageProps } from '../../types/chat';
import SuggestionButtons from './SuggestionButtons'; // ✅ Import suggestion buttons
import MarkdownRenderer from '../stream/MarkdownRenderer'; // ✅ Use professional markdown renderer
import './MessageItem.css'; // ✅ Custom styles for markdown in chat bubbles
const { Text } = Typography;

const MessageItem: React.FC<MessageProps> = ({ message: msg, onCopy, onRetry, onToggleImportant, onSuggestionClick }) => {

  const isUser = msg.role === 'user';

  // Helper to determine file type from URL
  const getFileType = (url: string): string => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
    if (ext === 'pdf') return 'pdf';
    return 'other';
  };

  const getFileIcon = (url: string) => {
    const type = getFileType(url);
    if (type === 'pdf') return <FilePdfOutlined style={{ fontSize: 24, color: '#ef4444' }} />;
    if (type === 'video') return <PlayCircleOutlined style={{ fontSize: 24, color: '#3b82f6' }} />;
    return <FileOutlined style={{ fontSize: 24, color: '#6b7280' }} />;
  };

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
        backgroundColor: msg.important 
          ? (isUser ? '#7c3aed' : '#fef3c7') // ✅ Important: User tím, AI vàng nhạt
          : (isUser ? '#0284c7' : '#f3f4f6'), // ✅ Normal: User xanh, AI xám
        color: msg.important
          ? (isUser ? '#ffffff' : '#92400e') // ✅ Important: User trắng, AI vàng đậm
          : (isUser ? '#ffffff' : '#1f2937'), // ✅ Normal: User trắng, AI đen
        borderRadius: 16,
        padding: '12px 16px',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontSize: 22,
        boxShadow: msg.important ? '0 2px 8px rgba(124, 58, 237, 0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
        maxWidth: '100%',
        border: msg.important ? '2px solid #a78bfa' : 'none',
      } as React.CSSProperties,
      markdownWrapper: {
        fontSize: 15,
        lineHeight: 1.7,
        color: msg.important
          ? (isUser ? '#ffffff' : '#92400e')
          : (isUser ? '#ffffff' : '#1f2937'),
      } as React.CSSProperties,
      actions: {
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginTop: 4,
        gap: 8,
      } as React.CSSProperties,
    };
  }, [isUser, msg.important]);
  
  const handleCopy = async () => {
    try {
      // Get the rendered content as plain text from the DOM
      const messageElement = document.getElementById(`message-${msg.id}`);
      const markdownContent = messageElement?.querySelector('.markdown-renderer');
      
      if (markdownContent) {
        // Copy the rendered text content (not HTML)
        const textContent = markdownContent.textContent || msg.content;
        await navigator.clipboard.writeText(textContent);
      } else {
        // Fallback to original content if markdown not found
        await navigator.clipboard.writeText(msg.content);
      }
      
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
    <div style={styles.container} id={`message-${msg.id}`}>
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
        
        <div 
          style={styles.bubble}
          className={`message-bubble-content ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}
        >
          {/* ✅ Attachments - Images first */}
          {msg.attachments && msg.attachments.length > 0 && (
            <div style={{ marginBottom: msg.content ? 12 : 0 }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {msg.attachments.map((url, index) => {
                  const fileType = getFileType(url);
                  
                  if (fileType === 'image') {
                    return (
                      <Image
                        key={index}
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        style={{ 
                          borderRadius: 8, 
                          maxWidth: '100%',
                          maxHeight: 300,
                          objectFit: 'cover'
                        }}
                        preview={{
                          mask: '🔍 View full size'
                        }}
                      />
                    );
                  } else {
                    // PDF, video, or other files - show as download link
                    return (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 12px',
                          background: isUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                          borderRadius: 8,
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        {getFileIcon(url)}
                        <Text style={{ 
                          color: isUser ? '#ffffff' : '#1f2937',
                          fontSize: 14
                        }}>
                          {fileType === 'pdf' ? '📄 PDF Document' : fileType === 'video' ? '🎥 Video File' : '📎 File'}
                        </Text>
                      </a>
                    );
                  }
                })}
              </Space>
            </div>
          )}

          {/* Message content */}
          {msg.content && (
            <div style={styles.markdownWrapper}>
              <MarkdownRenderer content={msg.content} />
            </div>
          )}
          
          {msg.isStreaming && (
            <span style={{ 
              marginLeft: 6, 
              animation: 'blink 1s infinite',
              fontSize: 18,
              color: '#0284c7'
            }}>● AI is typing...</span>
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

          {/* ✅ Important button for all messages */}
          <Tooltip title={msg.important ? "Remove from important" : "Mark as important"}>
            <Button
              type="text"
              size="small"
              icon={msg.important ? <StarFilled /> : <StarOutlined />}
              onClick={() => onToggleImportant?.(msg.id, !msg.important)}
              style={{ 
                color: msg.important ? '#f59e0b' : '#6b7280',
                fontSize: 18
              }}
            />
          </Tooltip>
        </div>

        {/* ✅ Suggestion buttons (only for AI messages with suggestions) */}
        {!isUser && msg.suggestions && msg.suggestions.length > 0 && onSuggestionClick && (
          <SuggestionButtons
            suggestions={msg.suggestions}
            onSuggestionClick={onSuggestionClick}
            isLoading={msg.isStreaming}
          />
        )}
      </div>
    </div>
  );
};

export default MessageItem;