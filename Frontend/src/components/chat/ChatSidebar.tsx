import React, { useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, Button, Typography, Empty, Avatar, Divider, Spin } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import DraggableConversationItem from './DraggableConversationItem';
import ProjectSidebar from './ProjectSidebar';
import type { ProjectSidebarRef } from './ProjectSidebar'; // ✅ Type-only import
import type { Conversation } from '../../types/chat';

const { Title, Text } = Typography;

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenSearch?: () => void; // ✅ Global semantic search
  userName?: string;
  userEmail?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

// ✅ Export ref type
export interface ChatSidebarRef {
  refreshProject: (projectId: string) => Promise<void>;
}

const ChatSidebar = forwardRef<ChatSidebarRef, ChatSidebarProps>(({
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onLogout,
  onOpenSettings,
  onOpenSearch,
  userName,
  userEmail,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}, ref) => {

  const listRef = useRef<HTMLDivElement>(null);
  const projectSidebarRef = useRef<ProjectSidebarRef>(null); // ✅ Ref for ProjectSidebar
  
  // ✅ Expose methods to parent
  useImperativeHandle(ref, () => ({
    refreshProject: async (projectId: string) => {
      if (projectSidebarRef.current) {
        await projectSidebarRef.current.refreshProject(projectId);
      }
    },
  }), []);
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
      gap: 12, // ✅ Reduced from 18
      padding: 16, // ✅ Reduced from 20
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12, // ✅ Reduced from 16
    } as React.CSSProperties,
    headerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: 10, // ✅ Reduced from 14
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
      fontSize: 15, // ✅ Added consistent size
    } as React.CSSProperties,
    subtitle: {
      color: '#64748b',
      fontSize: 13, // ✅ Reduced from 16
    } as React.CSSProperties,
    newChatButton: {
      borderRadius: 8, // ✅ Reduced from 20 for consistency
      height: 40, // ✅ Reduced from 60
      fontWeight: 600,
      fontSize: 14, // ✅ Added
    } as React.CSSProperties,
    searchInput: {
      borderRadius: 8, // ✅ Reduced from 20
      height: 40, // ✅ Reduced from 60
    } as React.CSSProperties,
    list: {
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 8, // ✅ Reduced from 15
      paddingRight: 8, // ✅ Reduced from 10
    } as React.CSSProperties,
    footer: {
      display: 'grid',
      gap: 12, // ✅ Reduced from 20
    } as React.CSSProperties,
    footerButton: {
      borderRadius: 8, // ✅ Reduced from 20
      height: 40, // ✅ Reduced from 60
      fontSize: 14, // ✅ Added
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
            size={40} // ✅ Reduced from 52
            icon={!userName && !userEmail ? <UserOutlined /> : undefined}
            style={{ background: '#6366f1', fontWeight: 600, fontSize: 16 }}
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

      {onOpenSearch && (
        <Button
          icon={<SearchOutlined />}
          onClick={onOpenSearch}
          block
          style={{ 
            ...styles.newChatButton, 
            background: '#f3f4f6',
            color: '#374151',
            borderColor: '#e5e7eb'
          }}
        >
          Search all messages
        </Button>
      )}

      {/* ✅ Project Sidebar - Below Search Button */}
      <ProjectSidebar 
        ref={projectSidebarRef} 
        currentConversationId={currentConversationId} 
      />

      <Divider style={{ margin: '0' }} />

      <div style={styles.list} ref={listRef}>
        {conversations.length ? (
          <>
            {conversations.map((conversation) => (
              <DraggableConversationItem
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
});

ChatSidebar.displayName = 'ChatSidebar';

export default ChatSidebar;
