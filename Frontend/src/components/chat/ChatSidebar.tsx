import React, { useMemo, useRef, useEffect, forwardRef, useImperativeHandle, type CSSProperties, useState } from 'react';
import { Card, Button, Typography, Empty, Avatar, Divider, Spin } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
  DashboardOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; // ✅ For navigation
import { useDroppable } from '@dnd-kit/core';
import DraggableConversationItem from './DraggableConversationItem';
import ProjectSidebar from './ProjectSidebar';
import type { ProjectSidebarRef } from './ProjectSidebar'; // ✅ Type-only import
import type { Conversation } from '../../types/chat';

const { Text } = Typography;

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onUpdateTag: (id: string, tag: string | null) => Promise<void>; // ✅ New callback for tag
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
  refreshAllProjects: () => Promise<void>; // ✅ Add new method
}

const ChatSidebar = forwardRef<ChatSidebarRef, ChatSidebarProps>(({
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onUpdateTag,
  onLogout,
  onOpenSettings,
  onOpenSearch,
  userName,
  userEmail,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}, ref) => {

  const containerRef = useRef<HTMLDivElement>(null); // ✅ Ref for scrollable container
  const projectSidebarRef = useRef<ProjectSidebarRef>(null); // ✅ Ref for ProjectSidebar
  const [isAccountExpanded, setIsAccountExpanded] = useState(false); // ✅ State for account section
  
  // ✅ Make conversations list a droppable zone to unlink from projects
  const { setNodeRef: setDroppableRef, isOver: isDropOver } = useDroppable({
    id: 'main-conversations-list',
    data: {
      type: 'conversations-list', // Special type to unlink conversations
    },
  });
  
  // ✅ Expose methods to parent
  useImperativeHandle(ref, () => ({
    refreshProject: async (projectId: string) => {
      if (projectSidebarRef.current) {
        await projectSidebarRef.current.refreshProject(projectId);
      }
    },
    refreshAllProjects: async () => {

      if (projectSidebarRef.current) {
        await projectSidebarRef.current.refreshAllProjects();
      }
    },
  }), []);
  // Handle scroll to load more conversations
  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement || !onLoadMore || !hasMore || isLoadingMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = containerElement;
      const scrollThreshold = 200; // pixels from bottom
      
      // Check if scrolled near bottom
      if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
        onLoadMore();
      }
    };

    containerElement.addEventListener('scroll', handleScroll);
    return () => containerElement.removeEventListener('scroll', handleScroll);
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

  const navigate = useNavigate(); // ✅ Hook for navigation

  const containerStyle: CSSProperties = {
    display: 'flex',
    gap: 8,
    width: '100%',
    marginBottom: 8,
  };

  const buttonStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 40,
    fontSize: 14,
    fontWeight: 500,
  };
  const styles = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 16,
      overflowY: 'auto', // ✅ Move scroll to container
      overflowX: 'hidden',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    } as React.CSSProperties,
    headerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
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
      fontSize: 15,
    } as React.CSSProperties,
    subtitle: {
      color: '#64748b',
      fontSize: 13,
    } as React.CSSProperties,
    newChatButton: {
      borderRadius: 8,
      height: 40,
      fontWeight: 600,
      fontSize: 14,
    } as React.CSSProperties,
    searchInput: {
      borderRadius: 8,
      height: 40,
    } as React.CSSProperties,
    list: {
      // ✅ Remove flex: 1 and overflowY
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      paddingRight: 8,
    } as React.CSSProperties,
    footer: {
      display: 'grid',
      gap: 12,
    } as React.CSSProperties,
    footerButton: {
      borderRadius: 8,
      height: 40,
      fontSize: 14,
    } as React.CSSProperties,
  };

  return (
    <Card
      bordered={false}
      style={{ height: '100%', borderRadius: 24, background: '#ffffff', overflow: 'hidden' }}
      bodyStyle={{ padding: 0, height: '100%' }}
    >
      {/* ✅ Scrollable container */}
      <div ref={containerRef} style={styles.container}>
        {/* ✅ NEW: Start with action buttons directly */}
        <div style={containerStyle}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onNewConversation}
        style={{ ...buttonStyle, flex: 2, justifyContent: 'center' }}
      >
        New chat
      </Button>

      <Button
        icon={<SearchOutlined />}
        onClick={onOpenSearch}
        style={{
          ...buttonStyle,
          flex: 1,
          background: '#f3f4f6',
          color: '#374151',
          borderColor: '#e5e7eb',
        }}
      >
        Search
      </Button>
    </div>
    

      {/* ✅ Project Sidebar - Below Search Button */}
      <ProjectSidebar 
        ref={projectSidebarRef} 
        currentConversationId={currentConversationId} 
      />

      <Divider style={{ margin: '0' }} />

      <div 
        style={{
          ...styles.list,
          border: isDropOver ? '2px dashed #1677ff' : '2px solid transparent',
          background: isDropOver ? '#e6f4ff' : 'transparent',
          transition: 'all 0.2s ease',
        }} 
        ref={setDroppableRef}
      >
        {conversations.length ? (
          <>
            {conversations
              .filter((conv, index, self) => 
                index === self.findIndex(c => c.id === conv.id)
              )
              .map((conversation) => (
              <DraggableConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === currentConversationId}
                onClick={onSelectConversation}
                onDelete={onDeleteConversation}
                onRename={onRenameConversation}
                onUpdateTag={onUpdateTag}
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

      {/* ✅ NEW: Collapsible Footer Section */}
      <Divider style={{ margin: '12px 0' }} />
      
      {/* Header - Click to expand/collapse */}
      <div
        onClick={() => setIsAccountExpanded(!isAccountExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          cursor: 'pointer',
          borderRadius: 8,
          transition: 'all 0.2s',
          background: isAccountExpanded ? '#f0f2f5' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isAccountExpanded) {
            e.currentTarget.style.background = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (!isAccountExpanded) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {/* Toggle Arrow */}
        <div style={{ marginRight: 10, transition: 'transform 0.2s' }}>
          {isAccountExpanded ? (
            <DownOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
          ) : (
            <RightOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
          )}
        </div>

        {/* User Avatar */}
        <Avatar
          size={32}
          icon={!userName && !userEmail ? <UserOutlined /> : undefined}
          style={{ background: '#6366f1', fontWeight: 600, fontSize: 14, marginRight: 10 }}
        >
          {userName || userEmail ? initials : undefined}
        </Avatar>

        {/* User Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: 13, 
            color: '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {userName || 'Your workspace'}
          </div>
          <div style={{ 
            fontSize: 11, 
            color: '#6b7280',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {userEmail || 'active session'}
          </div>
        </div>
      </div>

      {/* Expanded Content - Action Buttons */}
      {isAccountExpanded && (
        <div
          style={{
            marginTop: 8,
            paddingLeft: 8,
            paddingRight: 8,
            animation: 'slideDown 0.2s ease-out',
          }}
        >
          <Button
            icon={<DashboardOutlined />}
            onClick={() => {
              navigate('/dashboard');
            }}
            block
            size="middle"
            style={{ 
              textAlign: 'left', 
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            Dashboard
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={onOpenSettings}
            block
            size="middle"
            style={{ 
              textAlign: 'left', 
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            Settings
          </Button>
          <Button
            danger
            icon={<LogoutOutlined />}
            onClick={onLogout}
            block
            size="middle"
            style={{ 
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            Log out
          </Button>
        </div>
      )}

      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      </div> {/* End scrollable container */}
    </Card>
  );
});

ChatSidebar.displayName = 'ChatSidebar';

export default ChatSidebar;
