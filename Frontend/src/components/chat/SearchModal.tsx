import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Modal, Input, List, Tag, Empty, Spin, Radio, Space, Typography } from 'antd';
import type { InputRef } from 'antd';
import { SearchOutlined, MessageOutlined, ClockCircleOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import messageService from '../../services/message.service';

const { Text, Paragraph } = Typography;

// SearchResult matches SearchResultFrontend from message.service.ts
interface SearchResult {
  id: string;
  content: string;
  conversation_id: string;
  conversation_title?: string;
  relevance_score?: number;
  role: 'user' | 'assistant';
  timestamp: Date;
  important?: boolean;
}

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  currentUserId: string | null;
}

const SearchModal: React.FC<SearchModalProps> = ({ 
  visible, 
  onClose, 
  currentUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'all' | 'important'>('all');
  const inputRef = useRef<InputRef>(null);
  const navigate = useNavigate();

  // Auto focus input when modal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Reset state when modal closes
      setSearchQuery('');
      setSearchResults([]);
      setSearchMode('all');
    }
  }, [visible]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !currentUserId) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await messageService.semanticSearch(searchQuery, 20);
      console.log('Semantic search response:', response);
      
      // Filter by important flag if needed
      let results = response.results || [];
      if (searchMode === 'important') {
        results = results.filter(r => r.important);
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchMode, currentUserId]);
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  const handleResultClick = useCallback((result: SearchResult) => {
    // Navigate to the conversation and scroll to the message
    navigate(`/chat/${result.conversation_id}`, { 
      state: { 
        highlightMessageId: result.id,
        scrollToMessageId: result.id 
      } 
    });
    onClose();
  }, [navigate, onClose]);

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
    return date.toLocaleDateString();
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    // Simple highlighting - you can make this more sophisticated
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} style={{ backgroundColor: '#ffd666', padding: '0 2px' }}>{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      styles={{
        body: { padding: 0 },
      }}
      style={{ top: 40 }}
      destroyOnClose
    >
      {/* Header with gradient background */}
      <div style={{ 
        padding: '24px 28px',
        borderBottom: '1px solid #f0f0f0',
        background: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <SearchOutlined style={{ fontSize: 28, color: 'white' }} />
          <Text strong style={{ fontSize: 20, color: 'white', margin: 0 }}>
            Search All Messages
          </Text>
        </div>
        
        <Input
          ref={inputRef}
          size="large"
          placeholder={"Search across all conversations..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
          style={{
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            marginTop: 16,
            fontSize: 16,
          }}
        />

        <Space style={{ marginTop: 16 }} size="middle">
          <Radio.Group 
            value={searchMode} 
            onChange={(e) => setSearchMode(e.target.value)}
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="all" style={{ borderRadius: '8px 0 0 8px' }}>
              <MessageOutlined /> All Messages
            </Radio.Button>
            <Radio.Button value="important" style={{ borderRadius: '0 8px 8px 0' }}>
              <StarFilled style={{ color: '#faad14' }} /> Important Only
            </Radio.Button>
          </Radio.Group>
          
          {searchQuery && (
            <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            </Tag>
          )}
        </Space>
      </div>

      {/* Results area */}
      <div style={{ 
        maxHeight: '550px', 
        overflowY: 'auto',
        padding: '20px 28px',
        background: '#fafafa',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 20, color: '#8c8c8c', fontSize: 15 }}>
              Searching for relevant messages...
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <List
            dataSource={searchResults}
            renderItem={(result, index) => (
              <List.Item
                key={result.id}
                onClick={() => handleResultClick(result)}
                style={{
                  cursor: 'pointer',
                  padding: '16px',
                  marginBottom: index < searchResults.length - 1 ? 12 : 0,
                  borderRadius: 8,
                  border: '1px solid #f0f0f0',
                  transition: 'all 0.2s',
                  background: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f7fa';
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(102, 126, 234, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#f0f0f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag color={result.role === 'user' ? 'blue' : 'green'}>
                        {result.role === 'user' ? 'You' : 'AI'}
                      </Tag>
                      {result.conversation_title && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          in "{result.conversation_title}"
                        </Text>
                      )}
                      {result.important && (
                        <StarFilled style={{ color: '#faad14', fontSize: 14 }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ClockCircleOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatTimestamp(result.timestamp)}
                      </Text>
                    </div>
                  </div>

                  <Paragraph 
                    ellipsis={{ rows: 3 }}
                    style={{ 
                      margin: 0,
                      color: '#262626',
                      lineHeight: 1.6,
                    }}
                  >
                    {highlightText(result.content, searchQuery)}
                  </Paragraph>

                  {result.relevance_score && (
                    <div style={{ marginTop: 8 }}>
                      <Tag color="purple" style={{ fontSize: 11 }}>
                        Relevance: {(result.relevance_score * 100).toFixed(0)}%
                      </Tag>
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        ) : searchQuery && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">No messages found</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Try a different search query or toggle search mode
                </Text>
              </div>
            }
            style={{ padding: '40px' }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
            <SearchOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
            <div style={{ fontSize: 14 }}>
              <div style={{ marginBottom: 8 }}>
                Type your query and press <kbd style={{ 
                  padding: '2px 6px', 
                  border: '1px solid #d9d9d9',
                  borderRadius: 3,
                  background: '#fafafa',
                  fontFamily: 'monospace'
                }}>Enter</kbd>
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Search finds messages by semantic meaning, not just keywords
              </div>
            </div>
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div style={{ 
          padding: '12px 24px',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
          textAlign: 'center'
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Found {searchResults.length} relevant message{searchResults.length !== 1 ? 's' : ''} • 
            Click to view in conversation
          </Text>
        </div>
      )}
    </Modal>
  );
};

export default SearchModal;
