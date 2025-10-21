import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, message, Typography } from 'antd';
import { SendOutlined, PaperClipOutlined, BulbOutlined } from '@ant-design/icons';
import type { ChatInputProps } from '../../types/chat';

const { TextArea } = Input;

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = 'Message ChatGPT...',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestMode, setSuggestMode] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isLoading) return;

    // Send message with suggest flag if enabled
    onSendMessage(trimmedValue, suggestMode);
    setInputValue('');
    
    // Reset suggest mode after sending
    if (suggestMode) setSuggestMode(false);
    
    // Reset textarea height
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = () => {
    message.info('File upload will be implemented soon!');
  };

  const handleSuggestIdeas = () => {
    if (isLoading) return;
    // Toggle suggest mode
    setSuggestMode(!suggestMode);
    message.info(suggestMode ? 'Suggest mode off' : 'Suggest mode on. Next message will include suggestions');
  };

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, []);

  return (
    <div style={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 12,
      paddingTop: 8,
      borderTop: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button
          icon={<PaperClipOutlined />}
          onClick={handleFileUpload}
          disabled={isLoading}
          style={{
            height: 44,
            borderRadius: 12,
            border: '1px solid #e5e7eb'
          }}
        />

        <Button
          icon={<BulbOutlined />}
          onClick={handleSuggestIdeas}
          disabled={isLoading}
          title={suggestMode ? "Suggestions enabled - Click to disable" : "Click to enable AI suggestions"}
          style={{
            height: 44,
            borderRadius: 12,
            border: suggestMode ? '2px solid #f59e0b' : '1px solid #e5e7eb',
            color: suggestMode? '#eb4f11ff' : '#f59e0b',
            backgroundColor: suggestMode ? '#fffbeb' : 'transparent',
          }}
        />

        <TextArea
          ref={textAreaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          autoSize={{ minRows: 1, maxRows: 6 }}
          disabled={isLoading}
          style={{ 
            borderRadius: 12, 
            padding: '12px 16px',
            border: '1px solid #e5e7eb',
            fontSize: 17,
            resize: 'none'
          }}
        />

        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          loading={isLoading}
          style={{ 
            borderRadius: 12, 
            height: 44,
            minWidth: 44,
            background: inputValue.trim() ? '#0284c7' : undefined,
            borderColor: inputValue.trim() ? '#0284c7' : undefined
          }}
        />
      </div>

      <Typography.Text style={{ 
        color: '#9ca3af', 
        fontSize: 11, 
        textAlign: 'center',
        padding: '0 16px'
      }}>
        {suggestMode ? (
          <span style={{ color: '#f59e0b', fontWeight: 500 }}>
            💡 Suggestions enabled - AI will provide follow-up questions
          </span>
        ) : (
          'Press Enter to send, Shift+Enter for new line'
        )}
      </Typography.Text>
    </div>
  );
};

export default ChatInput;