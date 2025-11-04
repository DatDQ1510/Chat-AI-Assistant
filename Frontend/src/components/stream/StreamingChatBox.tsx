import React, { useState, useRef, useEffect } from 'react';
import {
  Input,
  Button,
  Card,
  Spin,
  Space,
  Tooltip,
  message,
  Segmented,
  Empty,
} from 'antd';
import {
  SendOutlined,
  CopyOutlined,
  EyeOutlined,
  CodeOutlined,
  StopOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import MarkdownRenderer from './MarkdownRenderer';
import streamService from '../../services/stream.service';
import './StreamingChatBox.css';

const { TextArea } = Input;

type ViewMode = 'preview' | 'raw';

interface StreamingChatBoxProps {
  endpoint?: string; // Custom endpoint, default: /api/chat/stream
  placeholder?: string;
  maxHeight?: string;
  onStreamComplete?: (content: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Professional Streaming Chat Component
 * Features:
 * - Real-time streaming response
 * - Markdown rendering with syntax highlighting
 * - Toggle between Preview/Raw view
 * - Copy to clipboard
 * - Abort streaming
 * - Clean, responsive UI
 */
const StreamingChatBox: React.FC<StreamingChatBoxProps> = ({
  // endpoint, // TODO: Use custom endpoint in future
  placeholder = 'Type your message here...',
  maxHeight = '600px',
  onStreamComplete,
  onError,
}) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [messageHistory, setMessageHistory] = useState<Array<{ prompt: string; response: string }>>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const responseEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when response updates
  useEffect(() => {
    if (isStreaming && responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response, isStreaming]);

  const handleSend = async () => {
    if (!prompt.trim() || isStreaming) return;

    const currentPrompt = prompt.trim();
    setPrompt('');
    setResponse('');
    setIsStreaming(true);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      let accumulatedResponse = '';

      await streamService.streamChat(currentPrompt, {
        signal: abortControllerRef.current.signal,
        onChunk: (chunk: string) => {
          accumulatedResponse += chunk;
          setResponse(accumulatedResponse);
        },
        onComplete: () => {
          setIsStreaming(false);
          setMessageHistory(prev => [
            ...prev,
            { prompt: currentPrompt, response: accumulatedResponse },
          ]);
          onStreamComplete?.(accumulatedResponse);
          message.success('Response completed!');
        },
        onError: (error: Error) => {
          setIsStreaming(false);
          message.error(`Stream error: ${error.message}`);
          onError?.(error);
        },
      });
    } catch {
      setIsStreaming(false);
      // Error already handled in streamService
    }
  };

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      message.info('Stream aborted');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response);
      message.success('Copied to clipboard!');
    } catch {
      message.error('Failed to copy');
    }
  };

  const handleClear = () => {
    setResponse('');
    setMessageHistory([]);
    message.success('Cleared all messages');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="streaming-chat-box">
      {/* Input Area */}
      <Card
        className="input-card"
        title="💬 Streaming Chat"
        extra={
          <Space>
            <Tooltip title="Clear all">
              <Button
                icon={<DeleteOutlined />}
                onClick={handleClear}
                disabled={isStreaming || (!response && messageHistory.length === 0)}
              />
            </Tooltip>
          </Space>
        }
      >
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            autoSize={{ minRows: 2, maxRows: 6 }}
            disabled={isStreaming}
            className="prompt-input"
          />
          <Button
            type="primary"
            icon={isStreaming ? <StopOutlined /> : <SendOutlined />}
            onClick={isStreaming ? handleAbort : handleSend}
            loading={isStreaming}
            disabled={!prompt.trim() && !isStreaming}
            className="send-button"
          >
            {isStreaming ? 'Stop' : 'Send'}
          </Button>
        </Space.Compact>
        
        <div className="input-hint">
          Press <kbd>Ctrl+Enter</kbd> or <kbd>⌘+Enter</kbd> to send
        </div>
      </Card>

      {/* Response Area */}
      {(response || messageHistory.length > 0) && (
        <Card
          className="response-card"
          title={
            <Space>
              <span>📝 Response</span>
              {isStreaming && <Spin size="small" />}
            </Space>
          }
          extra={
            <Space>
              <Segmented
                value={viewMode}
                onChange={(value) => setViewMode(value as ViewMode)}
                options={[
                  {
                    label: (
                      <Tooltip title="Markdown Preview">
                        <EyeOutlined />
                      </Tooltip>
                    ),
                    value: 'preview',
                  },
                  {
                    label: (
                      <Tooltip title="Raw Markdown">
                        <CodeOutlined />
                      </Tooltip>
                    ),
                    value: 'raw',
                  },
                ]}
              />
              <Tooltip title="Copy Markdown">
                <Button
                  icon={<CopyOutlined />}
                  onClick={handleCopy}
                  disabled={!response && messageHistory.length === 0}
                />
              </Tooltip>
            </Space>
          }
          style={{ maxHeight, overflow: 'auto' }}
        >
          {/* Message History */}
          {messageHistory.map((msg, index) => (
            <div key={index} className="message-pair">
              <div className="user-message">
                <strong>You:</strong> {msg.prompt}
              </div>
              <div className="assistant-message">
                {viewMode === 'preview' ? (
                  <MarkdownRenderer content={msg.response} />
                ) : (
                  <pre className="raw-markdown">{msg.response}</pre>
                )}
              </div>
              {index < messageHistory.length - 1 && <div className="message-divider" />}
            </div>
          ))}

          {/* Current Streaming Response */}
          {response && (
            <div className="message-pair">
              <div className="user-message">
                <strong>You:</strong> {messageHistory.length > 0 ? 'Latest prompt...' : prompt}
              </div>
              <div className="assistant-message">
                {viewMode === 'preview' ? (
                  <MarkdownRenderer content={response} />
                ) : (
                  <pre className="raw-markdown">{response}</pre>
                )}
                {isStreaming && <span className="streaming-cursor">▊</span>}
              </div>
            </div>
          )}

          <div ref={responseEndRef} />
        </Card>
      )}

      {/* Empty State */}
      {!response && messageHistory.length === 0 && (
        <Card className="empty-state-card">
          <Empty
            description="No messages yet. Start chatting!"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  );
};

export default StreamingChatBox;
