import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Card, Button, Input, Typography, Empty, Tooltip, Avatar, Divider, Spin } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import ConversationItem from './ConversationItem';
import type { Conversation } from '../../types/chat';

const { Title, Text } = Typography;

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onClose: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  userName?: string;
  userEmail?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onClose,
  onLogout,
  onOpenSettings,
  userName,
  userEmail,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const lower = searchTerm.toLowerCase();
    return conversations.filter((conversation) =>
      conversation.title.toLowerCase().includes(lower)
    );
  }, [conversations, searchTerm]);

  // Handle scroll to load more conversations
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement || !onLoadMore || !hasMore || isLoadingMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = listElement;
      const scrollThreshold = 100; // pixels from bottom
      
      // Check if scrolled near bottom
      if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
        onLoadMore();
      }
    };

    listElement.addEventListener('scroll', handleScroll);
    return () => listElement.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, hasMore, isLoadingMore]);

  const initials = useMemo(() => {
    if (userName && userName.trim()) {
      return userName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
    }

    if (userEmail && userEmail.trim()) {
      return userEmail.charAt(0).toUpperCase();
    }

    return 'U';
  }, [userEmail, userName]);

  const styles = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      padding: 20,
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    } as React.CSSProperties,
    headerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flex: 1,
      minWidth: 0,
    } as React.CSSProperties,
    titleBlock: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      minWidth: 0,
    } as React.CSSProperties,
    title: {
      margin: 0,
      color: '#0f172a',
      lineHeight: 1.2,
    } as React.CSSProperties,
    subtitle: {
      color: '#64748b',
      fontSize: 16,
    } as React.CSSProperties,
    newChatButton: {
      borderRadius: 14,
      height: 44,
      fontWeight: 600,
    } as React.CSSProperties,
    searchInput: {
      borderRadius: 12,
    } as React.CSSProperties,
    list: {
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingRight: 6,
    } as React.CSSProperties,
    footer: {
      display: 'grid',
      gap: 10,
    } as React.CSSProperties,
    footerButton: {
      borderRadius: 12,
      height: 44,
    } as React.CSSProperties,
  };

  return (
    <Card
      bordered={false}
      style={{ height: '100%', borderRadius: 24, background: '#ffffff' }}
      bodyStyle={styles.container}
    >
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <Avatar
            size={52}
            icon={!userName && !userEmail ? <UserOutlined /> : undefined}
            style={{ background: '#6366f1', fontWeight: 600 }}
          >
            {userName || userEmail ? initials : undefined}
          </Avatar>
          <div style={styles.titleBlock}>
            <Title level={4} style={styles.title} ellipsis={{ tooltip: userName || 'Your workspace' }}>
              {userName || 'Your workspace'}
            </Title>
            <Text style={styles.subtitle} ellipsis={{ tooltip: userEmail || 'Ready to chat' }}>
              {userEmail || 'Ready to chat'}
            </Text>
          </div>
        </div>
        <Tooltip title="Thu gọn">
          <Button
            type="text"
            icon={<MenuFoldOutlined />}
            onClick={onClose}
            shape="circle"
          />
        </Tooltip>
      </div>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onNewConversation}
        block
        style={styles.newChatButton}
      >
        New chat
      </Button>

      <Input
        allowClear
        placeholder="Search conversations"
        prefix={<SearchOutlined />}
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        style={styles.searchInput}
        size="large"
      />

      <Divider style={{ margin: '0' }} />

      <div style={styles.list} ref={listRef}>
        {filteredConversations.length ? (
          <>
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === currentConversationId}
                onClick={onSelectConversation}
                onDelete={onDeleteConversation}
                onRename={onRenameConversation}
              />
            ))}
            {isLoadingMore && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Spin size="small" />
              </div>
            )}
          </>
        ) : (
          <Empty description={<Text type="secondary">No conversations yet</Text>} />
        )}
      </div>

      <div style={styles.footer}>
        <Button
          icon={<SettingOutlined />}
          onClick={onOpenSettings}
          block
          style={styles.footerButton}
        >
          Settings
        </Button>
        <Button
          danger
          icon={<LogoutOutlined />}
          onClick={onLogout}
          block
          style={styles.footerButton}
        >
          Log out
        </Button>
      </div>
    </Card>
  );
};

export default ChatSidebar;
