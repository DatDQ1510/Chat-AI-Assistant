import React, { useEffect, useState } from 'react';
import { Card, Button, Space } from 'antd';
import { BulbOutlined, SendOutlined } from '@ant-design/icons';
import { Socket } from 'socket.io-client';

interface ConversationStartersProps {
  socket: Socket | null;
  conversationId: string | null;
  onStarterClick: (starter: string) => void;
  isLoading?: boolean;
}

const ConversationStarters: React.FC<ConversationStartersProps> = ({
  socket,
  conversationId,
  onStarterClick,
  isLoading = false,
}) => {
  const [starters, setStarters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!socket || !conversationId) {
      setStarters([]);
      return;
    }

    // Request conversation starters when entering a conversation
    setLoading(true);
    
    socket.emit('get_conversation_starters', { conversation_id: conversationId });

    // Listen for starters response
    const handleStarters = (data: { conversation_id: string; starters: string[] }) => {
      if (data.conversation_id === conversationId) {
        setStarters(data.starters);
        setLoading(false);
      }
    };

    socket.on('conversation_starters', handleStarters);

    // Cleanup
    return () => {
      socket.off('conversation_starters', handleStarters);
    };
  }, [socket, conversationId]);

  // Don't show if no starters, loading, or if user is already chatting
  if (!starters.length || loading) {
    return null; // ✅ Hide completely instead of showing loading spinner
  }

  return (
    <div style={styles.container}>
      <Card
        bordered={false}
        style={styles.card}
        bodyStyle={styles.cardBody}
      >
        <div style={styles.header}>
          <BulbOutlined style={styles.icon} />
          <span style={styles.title}>Gợi ý câu hỏi</span>
        </div>
        
        <Space direction="horizontal" size={12} style={styles.startersContainer}>
          {starters.map((starter, index) => (
            <Button
              key={index}
              type="default"
              icon={<SendOutlined />}
              onClick={() => 
                {
                  onStarterClick(starter);
                }
              }
              disabled={isLoading}
              style={styles.starterButton}
              className="conversation-starter-btn"
            >
              {starter}
            </Button>
          ))}
        </Space>
      </Card>

      <style>
        {`
          .conversation-starter-btn {
            height: auto !important;
            min-height: 40px;
            white-space: normal;
            text-align: left;
            padding: 8px 16px;
            border-radius: 12px;
            border: 1px solid #e0e0e0;
            background: #ffffff;
            transition: all 0.3s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          
          .conversation-starter-btn:hover:not(:disabled) {
            border-color: #1890ff;
            background: #f0f7ff;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(24, 144, 255, 0.15);
          }
          
          .conversation-starter-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .conversation-starter-btn .anticon {
            margin-right: 8px;
            color: #1890ff;
          }
        `}
      </style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    marginBottom: 16,
    minHeight: 60, // Reserve space for loading state
  },
  card: {
    borderRadius: 16,
    background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  cardBody: {
    padding: '16px 20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 18,
    color: '#faad14',
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#262626',
  },
  startersContainer: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  starterButton: {
    flex: '1 1 calc(33.333% - 8px)',
    minWidth: 200,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#8c8c8c',
  },
};

export default ConversationStarters;
