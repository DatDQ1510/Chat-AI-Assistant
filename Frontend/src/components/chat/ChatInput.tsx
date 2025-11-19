import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Input, Button, message, Typography, Image, Space, Spin } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { SendOutlined, PaperClipOutlined, BulbOutlined, CloseCircleOutlined, FileOutlined, FilePdfOutlined, FileImageOutlined, PlayCircleOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ChatInputProps, AttachedFile } from '../../types/chat';
import uploadService from '../../services/upload.service';
import SelectedTextPreview from './SelectedTextPreview'; // ✅ Import preview component

const { TextArea } = Input;

// ✅ Export interface để ChatContainer có thể sử dụng
export interface ChatInputRef {
  setInputValue: (value: string) => void;
  focusInput: () => void;
  setSelectedText: (text: string) => void; // ✅ New method to set selected text
  clearSelectedText: () => void; // ✅ New method to clear selected text
}   

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({
  onSendMessage,
  isLoading = false,
  placeholder = 'Message ChatGPT...',
  onGenerateSuggestions, 
  lastAIMessage,
}, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [selectedText, setSelectedText] = useState(''); 
  const textAreaRef = useRef<TextAreaRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    setInputValue: (value: string) => {
      setInputValue(value);
    },
    focusInput: () => {
      textAreaRef.current?.focus();
    },
    setSelectedText: (text: string) => {
      setSelectedText(text);
    },
    clearSelectedText: () => {
      setSelectedText('');
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
    
    // ✅ Combine input value with selected text if exists
    const finalMessage = selectedText 
      ? (trimmedValue ? `${selectedText}\n\n${trimmedValue}` : selectedText)
      : trimmedValue;
    
    if (!finalMessage && successfullyUploadedFiles.length === 0) {
      if (isLoading) return;
      message.warning('Please type a message or upload files');
      return;
    }

    // Pass only successfully uploaded files with URLs
    onSendMessage(
      finalMessage || '📎 Files attached', 
      successfullyUploadedFiles.length > 0 ? successfullyUploadedFiles : undefined
    );
    
    setInputValue('');
    setSelectedText(''); // ✅ Clear selected text after sending
    setAttachedFiles([]);
    
    // Reset textarea height
    if (textAreaRef.current?.resizableTextArea?.textArea) {
      textAreaRef.current.resizableTextArea.textArea.style.height = 'auto';
    }
  };

  // ✅ Handler for sending selected text directly
  const handleSendSelectedText = () => {
    if (!selectedText) return;
    handleSend();
  };

  // ✅ Handler for clearing selected text
  const handleClearSelectedText = () => {
    setSelectedText('');
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

  // ✅ NEW: Handle paste event for images
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Check if clipboard contains image
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Only process image items
      if (item.type.startsWith('image/')) {
        e.preventDefault(); // Prevent default paste behavior for images
        
        const file = item.getAsFile();
        if (!file) continue;

        console.log('📋 Pasted image:', file.name, file.type, file.size);

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          message.error(`❌ Image size exceeds 10MB`);
          continue;
        }

        // Create a proper filename for pasted image
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = file.type.split('/')[1] || 'png';
        const properFileName = `pasted-image-${timestamp}.${extension}`;
        
        // Create a new File object with proper name
        const renamedFile = new File([file], properFileName, { type: file.type });

        const newFile: AttachedFile = {
          uid: Date.now().toString() + Math.random(),
          name: properFileName,
          type: file.type,
          file: renamedFile,
          uploading: true,
        };

        // Add file to state immediately
        setAttachedFiles(prev => [...prev, newFile]);
        message.loading(`📤 Uploading pasted image...`, 1);

        // Create preview
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
        reader.readAsDataURL(renamedFile);

        // Upload to Cloudinary
        try {
          const result = await uploadService.uploadFile(renamedFile);
          
          if (result.success && result.url) {
            setAttachedFiles(prev => 
              prev.map(f => 
                f.uid === newFile.uid 
                  ? { ...f, url: result.url, uploading: false }
                  : f
              )
            );
            message.success(`✅ Image uploaded successfully!`);
          } else {
            setAttachedFiles(prev => 
              prev.map(f => 
                f.uid === newFile.uid 
                  ? { ...f, uploading: false, uploadError: result.error || 'Upload failed' }
                  : f
              )
            );
            message.error(`❌ Upload failed: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Upload error:', error);
          setAttachedFiles(prev => 
            prev.map(f => 
              f.uid === newFile.uid 
                ? { ...f, uploading: false, uploadError: 'Upload failed' }
                : f
            )
          );
          message.error(`❌ Upload failed`);
        }
      }
    }
  };

  // ✅ NEW: Generate suggestions for the last AI message
  const handleGenerateSuggestionsClick = () => {
    if (!onGenerateSuggestions || !lastAIMessage) {
      message.warning('No AI message to generate suggestions for');
      return;
    }

    if (lastAIMessage.loadingSuggestions) {
      return; // Already generating
    }

    // Call parent handler to emit socket event and manage state
    onGenerateSuggestions();
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
      {/* ✅ Selected Text Preview - Shows above file attachments */}
      <SelectedTextPreview
        selectedText={selectedText}
        onClear={handleClearSelectedText}
        onSend={handleSendSelectedText}
      />

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

      {/* Input Area - All elements in one border container */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '8px 12px',
        background: '#fff',
        alignItems: 'flex-end',
      }}>
        <Button
          icon={<PaperClipOutlined style={{ fontSize: 18 }}/>}
          onClick={handleFileUpload}
          disabled={isLoading}
          type="text"
          style={{
            height: 40,
            minWidth: 40,
            color: attachedFiles.length > 0 ? '#0284c7' : '#6b7280',
          }}
        />

        <Button
          icon={<BulbOutlined style={{ fontSize: 18 }} />}
          onClick={handleGenerateSuggestionsClick}
          disabled={isLoading}
          type="text"
          title={
            !lastAIMessage 
              ? "No AI message yet" 
              : lastAIMessage.suggestions 
                ? "Suggestions already generated" 
                : lastAIMessage.loadingSuggestions 
                  ? "Generating suggestions..." 
                  : "Generate follow-up questions"
          }
          style={{
            height: 40,
            minWidth: 40,
            color: lastAIMessage?.loadingSuggestions ? '#f59e0b' : '#6b7280',
          }}
        />

        <TextArea
          ref={textAreaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          onPaste={handlePaste}
          placeholder={placeholder}
          autoSize={{ minRows: 1, maxRows: 6 }}
          disabled={isLoading}
          bordered={false}
          style={{ 
            padding: '8px 0',
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
            height: 40,
            minWidth: 40,
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
        {attachedFiles.length > 0 ? (
          <span style={{ color: '#0284c7', fontWeight: 500 }}>
            📎 {attachedFiles.length} file(s) ready to send
          </span>
        ) : lastAIMessage?.loadingSuggestions ? (
          <span style={{ color: '#f59e0b', fontWeight: 500 }}>
            💡 Generating follow-up questions...
          </span>
        ) : (
          <>
            Press Enter to send, Shift+Enter for new line
            <span style={{ color: '#10b981', marginLeft: 8 }}>• Paste images directly (Ctrl+V)</span>
          </>
        )}
      </Typography.Text>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;