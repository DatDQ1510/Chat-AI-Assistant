import React, { useState, useRef } from 'react';
import { Input, Modal, List, Typography, Empty, Space, Tag, message } from 'antd';
import { SearchOutlined, CloseOutlined, RobotOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import messageService from '../../services/message.service';

const { Text, Paragraph } = Typography;

interface SearchResult {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  relevance_score?: number;
}

interface SemanticChatDrawerProps {
  conversationId: string | null;
  onMessageClick?: (messageId: string) => void;
}

const SemanticChatDrawer: React.FC<SemanticChatDrawerProps> = ({
  conversationId,
  onMessageClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // ✅ Cache để lưu kết quả tìm kiếm - không cần gọi API lại
  const searchCacheRef = useRef<{ [query: string]: SearchResult[] }>({});

  // Substring content to ~100 words (approximately 600 characters)
  const truncateContent = (content: string, maxChars: number = 600): string => {
    if (content.length <= maxChars) return content;
    return content.substring(0, maxChars) + '...';
  };

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

  const handleSearch = async () => {
    if (!searchQuery.trim() || !conversationId) return;

    const cacheKey = `${conversationId}_${searchQuery.trim()}`;

    // ✅ Kiểm tra cache trước
    if (searchCacheRef.current[cacheKey]) {
      console.log('📦 Using cached search results');
      setSearchResults(searchCacheRef.current[cacheKey]);
      setModalVisible(true);
      return;
    }

    // ✅ Gọi API nếu chưa có trong cache
    setLoading(true);
    try {
      const response = await messageService.semanticSearch(
        searchQuery, 
        5, 
        conversationId, 
        0.3 // 30% relevance threshold
      );
      
      const results = response.results || [];
      
      // ✅ Lưu vào cache
      searchCacheRef.current[cacheKey] = results;
      
      setSearchResults(results);
      setModalVisible(true);
    } catch (error) {
      console.error('Semantic search error:', error);
      setSearchResults([]);
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      message.loading('Searching...', 3);
      handleSearch();
    }
  };

  const handleResultClick = (messageId: string) => {
    setModalVisible(false);
    onMessageClick?.(messageId);
  };

  return (
    <>
      {/* ✅ Simple Search Input - like search conversations */}
      <Input
        allowClear
        placeholder="Search messages in conversation"
        prefix={<SearchOutlined />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onPressEnter={handleKeyPress}
        disabled={!conversationId || loading}
        size="large"
        style={{
          borderRadius: 20,
          height: 48,
        }}
      />

      {/* ✅ Results Modal */}
      <Modal
        title={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <SearchOutlined style={{ color: '#764ba2', fontSize: 16 }} />
              <Text strong style={{ fontSize: 13 }}>Search Results</Text>
            </Space>
            <Tag color="purple" style={{ marginRight: 0, fontSize: 11 }}>
              {searchResults.length} found
            </Tag>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={480}
        closeIcon={<CloseOutlined />}
        styles={{
          body: { 
            padding: 0,
            maxHeight: '400px',
            overflowY: 'auto',
          },
        }}
      >
        {searchResults.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  No matching messages found
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Try a different search query
                </Text>
              </Space>
            }
            style={{ padding: '40px 20px' }}
          />
        ) : (
          <List
            dataSource={searchResults.slice(0, 5)}
            renderItem={(result, index) => (
              <List.Item
                key={result.id}
                onClick={() => handleResultClick(result.id)}
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
                      {result.role === 'user' ? (
                        <Tag color="blue" icon={<UserOutlined />} style={{ fontSize: 10, padding: '0 4px' }}>
                          You
                        </Tag>
                      ) : (
                        <Tag color="green" icon={<RobotOutlined />} style={{ fontSize: 10, padding: '0 4px' }}>
                          AI
                        </Tag>
                      )}
                      <Tag color="purple" style={{ fontSize: 10, padding: '0 4px' }}>
                        Match #{index + 1}
                      </Tag>
                      {result.relevance_score && (
                        <Tag color="gold" style={{ fontSize: 10, padding: '0 4px' }}>
                          {(result.relevance_score * 100).toFixed(0)}% relevant
                        </Tag>
                      )}
                    </Space>
                    {result.timestamp && (
                      <Space size={3} style={{ color: '#8c8c8c' }}>
                        <ClockCircleOutlined style={{ fontSize: 10 }} />
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          {formatTimestamp(result.timestamp)}
                        </Text>
                      </Space>
                    )}
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
                    {truncateContent(result.content)}
                  </Paragraph>
                </div>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  );
};

export default SemanticChatDrawer;

