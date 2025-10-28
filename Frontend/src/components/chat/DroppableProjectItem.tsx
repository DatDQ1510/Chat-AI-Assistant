import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { List, Typography, Tooltip, Button, Dropdown, Input, Modal, Spin } from 'antd';
import type { MenuProps } from 'antd';
import {
  RightOutlined,
  DownOutlined,
  FolderOutlined,
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { ProjectItemProps } from '../../types/chat';

const { Text } = Typography;

const DroppableProjectItem: React.FC<ProjectItemProps> = ({
  project,
  isExpanded,
  onToggle,
  onDelete,
  onRename,
  onConversationClick,
  currentConversationId,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.project_name);
  const [loading, setLoading] = useState(false);

  // Setup droppable zone
  const { setNodeRef, isOver } = useDroppable({
    id: project.id,
    data: {
      type: 'project',
      project,
    },
  });

  const handleRename = async () => {
    if (newName.trim() && newName !== project.project_name) {
      setLoading(true);
      try {
        await onRename?.(project.id, newName.trim());
        setIsRenaming(false);
      } catch (error) {
        console.error('Failed to rename project:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setIsRenaming(false);
      setNewName(project.project_name);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Project',
      content: `Are you sure you want to delete "${project.project_name}"? All conversations in this project will be unlinked.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => onDelete?.(project.id),
    });
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'rename',
      label: 'Rename',
      icon: <EditOutlined />,
      onClick: () => setIsRenaming(true),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete,
    },
  ];

  const conversationCount = project.conversations?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        marginBottom: 4,
      }}
    >
      {/* Project Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px', // ✅ Increased from 8px 12px
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'all 0.2s',
          background: isOver ? '#e6f4ff' : isExpanded ? '#f0f2f5' : 'transparent',
          border: isOver ? '2px dashed #1677ff' : '2px solid transparent',
          boxShadow: isOver ? '0 0 8px rgba(22, 119, 255, 0.3)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded && !isOver) {
            e.currentTarget.style.background = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded && !isOver) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {/* Toggle Icon */}
        <div
          onClick={() => onToggle(project.id)}
          style={{
            marginRight: 10, // ✅ Increased from 8
            display: 'flex',
            alignItems: 'center',
            transition: 'transform 0.2s',
          }}
        >
          {isExpanded ? (
            <DownOutlined style={{ fontSize: 14, color: '#8c8c8c' }} /> 
          ) : (
            <RightOutlined style={{ fontSize: 14, color: '#8c8c8c' }} />
          )}
        </div>

        {/* Folder Icon */}
        <FolderOutlined
          style={{
            fontSize: 18, // ✅ Increased from 16
            color: isOver ? '#1677ff' : '#faad14',
            marginRight: 10, // ✅ Increased from 8
            transition: 'color 0.2s',
          }}
          onClick={() => onToggle(project.id)}
        />

        {/* Project Name */}
        <div
          style={{ flex: 1, minWidth: 0 }}
          onClick={() => onToggle(project.id)}
        >
          {isRenaming ? (
            <Input
              size="small"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onPressEnter={handleRename}
              onBlur={handleRename}
              autoFocus
              disabled={loading}
              style={{ width: '100%' }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <Tooltip title={project.project_name} placement="right">
              <Text
                strong
                style={{
                  fontSize: 15, // ✅ Increased from 14
                  color: isOver ? '#1677ff' : '#262626',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s',
                }}
              >
                {project.project_name}
              </Text>
            </Tooltip>
          )}
        </div>

        {/* Drop Indicator */}
        {isOver && (
          <Text
            style={{
              fontSize: 14, 
              color: '#1677ff',
              marginLeft: 8,
              marginRight: 4,
              fontWeight: 500,
              animation: 'pulse 1s ease-in-out infinite',
            }}
          >
            Drop here
          </Text>
        )}

        {/* Conversation Count Badge */}
        {!isOver && conversationCount > 0 && (
          <Text
            type="secondary"
            style={{
              fontSize: 14, // ✅ Increased from 11
              marginLeft: 8,
              marginRight: 4,
              color: '#2a0202ff',
              background: '#f87474ff',
              borderRadius: 10,
              padding: '2px 6px',
            }}
          >
            {conversationCount}
          </Text>
        )}

        {/* Menu Dropdown */}
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <Button
            type="text"
            size="small"
            icon={<EllipsisOutlined />}
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '2px 4px',
              opacity: 0.6,
            }}
          />
        </Dropdown>
      </div>

      {/* Conversations List */}
      {isExpanded && (
        <div
          style={{
            marginLeft: 28,
            marginTop: 4,
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <Spin size="small" />
            </div>
          ) : project.conversations && project.conversations.length > 0 ? (
            <List
              size="small"
              dataSource={project.conversations}
              renderItem={(conversation) => (
                <List.Item
                  key={conversation.id}
                  onClick={() => onConversationClick?.(conversation.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: currentConversationId === conversation.id ? '#e6f4ff' : 'transparent',
                    border: currentConversationId === conversation.id ? '1px solid #91caff' : '1px solid transparent',
                    marginBottom: 2,
                  }}
                  onMouseEnter={(e) => {
                    if (currentConversationId !== conversation.id) {
                      e.currentTarget.style.background = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentConversationId !== conversation.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
                    <MessageOutlined style={{ fontSize: 15, color: '#8c8c8c', marginRight: 8, flexShrink: 0 }} />
                    <Tooltip title={conversation.title} placement="right">
                      <Text
                        style={{
                          fontSize: 15,
                          color: currentConversationId === conversation.id ? '#1677ff' : '#7d7b7bff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {conversation.title}
                      </Text>
                    </Tooltip>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0', color: '#8c8c8c', fontSize: 12 }}>
              No conversations yet
            </div>
          )}
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </div>
  );
};

export default DroppableProjectItem;
