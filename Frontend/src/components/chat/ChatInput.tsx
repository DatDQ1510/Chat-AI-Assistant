import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Input, Button, message, Typography, Image, Space, Spin } from 'antd';
import { SendOutlined, PaperClipOutlined, BulbOutlined, CloseCircleOutlined, FileOutlined, FilePdfOutlined, FileImageOutlined, PlayCircleOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ChatInputProps, AttachedFile } from '../../types/chat';
import uploadService from '../../services/upload.service';

const { TextArea } = Input;

// ✅ Export interface để ChatContainer có thể sử dụng
export interface ChatInputRef {
  setInputValue: (value: string) => void;
  focusInput: () => void;
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({
  onSendMessage,
  isLoading = false,
  placeholder = 'Message ChatGPT...',
}, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestMode, setSuggestMode] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Expose methods để ChatContainer có thể gọi
  useImperativeHandle(ref, () => ({
    setInputValue: (value: string) => {
      setInputValue(value);
    },
    focusInput: () => {
      textAreaRef.current?.focus();
    },
  }));

  const handleSend = () => {
    const trimmedValue = inputValue.trim();
    
    // ✅ Check if any files are still uploading
    const uploadingFiles = attachedFiles.filter(f => f.uploading);
    if (uploadingFiles.length > 0) {
      message.warning(`⏳ Please wait, ${uploadingFiles.length} file(s) still uploading...`);
      return;
    }
    
    // ✅ Filter only successfully uploaded files (have URL)
    const successfullyUploadedFiles = attachedFiles.filter(f => f.url && !f.uploadError);
    
    if (!trimmedValue && successfullyUploadedFiles.length === 0) {
      if (isLoading) return;
      message.warning('Please type a message or upload files');
      return;
    }

    // Pass only successfully uploaded files with URLs
    onSendMessage(
      trimmedValue || '📎 Files attached', 
      suggestMode,
      successfullyUploadedFiles.length > 0 ? successfullyUploadedFiles : undefined
    );
    
    setInputValue('');
    setAttachedFiles([]);
    
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      // Validate file type
      const isAllowed =
        file.type === 'application/pdf' ||
        file.type.startsWith('image/') ||
        file.type.startsWith('video/');
      
      if (!isAllowed) {
        message.error(`❌ ${file.name}: Only PDF, images, and videos are allowed`);
        continue;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        message.error(`❌ ${file.name}: File size exceeds 10MB`);
        continue;
      }

      const newFile: AttachedFile = {
        uid: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type,
        file,
        uploading: true, // ✅ Start with uploading state
      };

      // Add file to state immediately
      setAttachedFiles(prev => [...prev, newFile]);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setAttachedFiles(prev => 
            prev.map(f => 
              f.uid === newFile.uid 
                ? { ...f, preview: event.target?.result as string }
                : f
            )
          );
        };
        reader.readAsDataURL(file);
      }

      // ✅ Upload to Cloudinary immediately
      try {
        const result = await uploadService.uploadFile(file);
        
        if (result.success && result.url) {
          // Update file with URL and remove uploading state
          setAttachedFiles(prev => 
            prev.map(f => 
              f.uid === newFile.uid 
                ? { ...f, url: result.url, uploading: false }
                : f
            )
          );
        } else {
          // Mark upload as failed
          setAttachedFiles(prev => 
            prev.map(f => 
              f.uid === newFile.uid 
                ? { ...f, uploading: false, uploadError: result.error || 'Upload failed' }
                : f
            )
          );
          message.error(`❌ ${file.name}: ${result.error || 'Upload failed'}`);
        }
      } catch {
        setAttachedFiles(prev => 
          prev.map(f => 
            f.uid === newFile.uid 
              ? { ...f, uploading: false, uploadError: 'Upload failed' }
              : f
          )
        );
        message.error(`❌ ${file.name}: Upload failed`);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (uid: string) => {
    setAttachedFiles(prev => prev.filter(f => f.uid !== uid));
  };

  const handleSuggestIdeas = () => {
    if (isLoading) return;
    setSuggestMode(!suggestMode);
    message.info(suggestMode ? 'Suggest mode off' : 'Suggest mode on. Next message will include suggestions');
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImageOutlined style={{ color: '#52c41a' }} />;
    if (type === 'application/pdf') return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    if (type.startsWith('video/')) return <PlayCircleOutlined style={{ color: '#1890ff' }} />;
    return <FileOutlined />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
      gap: 8,
      paddingTop: 8,
    }}>
      {/* File Preview Area */}
      {attachedFiles.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: '#f5f7fa',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
        }}>
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            <Typography.Text strong style={{ fontSize: 12, color: '#6b7280' }}>
              📎 Attached Files ({attachedFiles.length})
            </Typography.Text>
            <Space wrap size={[8, 8]}>
              {attachedFiles.map(file => (
                <div
                  key={file.uid}
                  style={{
                    position: 'relative',
                    padding: '8px 12px',
                    background: 'white',
                    borderRadius: 8,
                    border: file.uploadError 
                      ? '1px solid #ef4444' 
                      : file.uploading 
                        ? '1px solid #0284c7'
                        : '1px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    maxWidth: 200,
                    opacity: file.uploadError ? 0.6 : 1,
                  }}
                >
                  {/* ✅ Loading/Success indicator */}
                  {file.uploading && (
                    <Spin 
                      indicator={<LoadingOutlined style={{ fontSize: 20, color: '#0284c7' }} spin />} 
                    />
                  )}
                  {!file.uploading && !file.uploadError && file.url && (
                    <CheckCircleOutlined style={{ fontSize: 20, color: '#10b981' }} />
                  )}
                  
                  {file.preview && !file.uploading ? (
                    <Image
                      src={file.preview}
                      alt={file.name}
                      width={40}
                      height={40}
                      style={{ borderRadius: 4, objectFit: 'cover' }}
                      preview={false}
                    />
                  ) : !file.uploading ? (
                    <div style={{ fontSize: 24 }}>
                      {getFileIcon(file.type)}
                    </div>
                  ) : null}
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text 
                      ellipsis 
                      style={{ 
                        fontSize: 12, 
                        display: 'block', 
                        lineHeight: 1.2,
                        color: file.uploadError ? '#ef4444' : undefined 
                      }}
                    >
                      {file.name}
                    </Typography.Text>
                    <Typography.Text 
                      type="secondary" 
                      style={{ fontSize: 11, lineHeight: 1.2 }}
                    >
                      {file.uploading 
                        ? 'Uploading...' 
                        : file.uploadError 
                          ? 'Failed' 
                          : formatFileSize(file.file.size)}
                    </Typography.Text>
                  </div>
                  
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleRemoveFile(file.uid)}
                    style={{ 
                      position: 'absolute', 
                      top: -6, 
                      right: -6,
                      minWidth: 20,
                      height: 20,
                      padding: 0,
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '50%',
                    }}
                  />
                </div>
              ))}
            </Space>
          </Space>
        </div>
      )}

      {/* Input Area */}
      <div style={{ display: 'flex', gap: 15 }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        
        <Button
          icon={<PaperClipOutlined style={{ fontSize: 16 }}/>}
          onClick={handleFileUpload}
          disabled={isLoading}
          style={{
            height: 44,
            borderRadius: 8,
            minWidth: 44,
            border: attachedFiles.length > 0 ? '2px solid #0284c7' : '1px solid #e5e7eb',
            color: attachedFiles.length > 0 ? '#0284c7' : undefined,
            backgroundColor: attachedFiles.length > 0 ? '#f0f9ff' : 'transparent',
          }}
        />

        <Button
          icon={<BulbOutlined style={{ fontSize: 20 }} />}
          onClick={handleSuggestIdeas}
          disabled={isLoading}
          title={suggestMode ? "Suggestions enabled - Click to disable" : "Click to enable AI suggestions"}
          style={{
            height: 44  ,
            borderRadius: 8,
            minWidth: 44,
            border: suggestMode ? '2px solid #f59e0b' : '1px solid #e5e7eb',
            color: suggestMode ? '#eb4f11ff' : '#f59e0b',
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
            borderRadius: 8, 
            padding: '12px 16px',
            border: '1px solid #e5e7eb',
            fontSize: 14,
            resize: 'none'
          }}
        />

        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading}
          loading={isLoading}
          style={{ 
            borderRadius: 8, 
            height: 44,
            minWidth: 44,
            background: (inputValue.trim() || attachedFiles.length > 0) ? '#0284c7' : undefined,
            borderColor: (inputValue.trim() || attachedFiles.length > 0) ? '#0284c7' : undefined
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
        ) : attachedFiles.length > 0 ? (
          <span style={{ color: '#0284c7', fontWeight: 500 }}>
            📎 {attachedFiles.length} file(s) ready to send
          </span>
        ) : (
          'Press Enter to send, Shift+Enter for new line'
        )}
      </Typography.Text>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;