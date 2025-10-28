import React, { useState, useRef, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { List, Typography, Tooltip, Button, Dropdown, Input, Modal, Spin } from 'antd';
import type { MenuProps } from 'antd';
import {
  RightOutlined,
  DownOutlined,
  FolderOutlined,
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ProjectItemProps } from '../../types/chat';
import DraggableProjectConversationItem from './DraggableProjectConversationItem';

const { Text } = Typography;

const DRAG_THRESHOLD = 5; // Simple threshold như conversation

const DraggableDroppableProjectItem: React.FC<ProjectItemProps> = ({
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
  
  // Simple drag state for project header
  const [isDragActive, setIsDragActive] = useState(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  // Setup droppable zone (for conversations to drop into)
  const { setNodeRef: setDroppableRef, isOver: isDropOver } = useDroppable({
    id: `project-drop-${project.id}`,
    data: {
      type: 'project',
      project,
    },
  });

  // Setup draggable (for reordering projects)
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `project-drag-${project.id}`,
    data: {
      type: 'project-reorder',
      project,
    },
    disabled: !isDragActive || isExpanded, // Disable drag when expanded
  });

  // Combine refs
  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      setDroppableRef(node);
      setDraggableRef(node);
    },
    [setDroppableRef, setDraggableRef]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Ignore if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('.ant-dropdown-trigger') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('.project-toggle') ||
      isExpanded
    ) {
      return;
    }

    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    setIsDragActive(false);
  }, [isExpanded]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mouseDownPosRef.current || hasMovedRef.current || isExpanded) return;

    const deltaX = Math.abs(e.clientX - mouseDownPosRef.current.x);
    const deltaY = Math.abs(e.clientY - mouseDownPosRef.current.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > DRAG_THRESHOLD) {
      hasMovedRef.current = true;
      setIsDragActive(true);
    }
  }, [isExpanded]);

  const handleMouseUp = useCallback(() => {
    setIsDragActive(false);
    mouseDownPosRef.current = null;
    hasMovedRef.current = false;
  }, []);

  const handleRename = async () => {
    if (newName.trim() && newName !== project.project_name) {
      setLoading(true);
      try {
        await onRename?.(project.id, newName.trim());
        setIsRenaming(false);
      } catch (error) {
        console.error('Rename failed:', error);
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

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'default',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    marginBottom: 4,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Project Header */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        {...(isDragActive && !isExpanded ? { ...attributes, ...listeners } : {})}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px',
          borderRadius: 8,
          transition: 'all 0.2s',
          background: isDropOver
            ? '#e6f4ff'
            : isExpanded
            ? '#f0f2f5'
            : 'transparent',
          border: isDropOver ? '2px dashed #1677ff' : '2px solid transparent',
          boxShadow: isDropOver
            ? '0 0 8px rgba(22, 119, 255, 0.3)'
            : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded && !isDropOver && !isDragActive) {
            e.currentTarget.style.background = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded && !isDropOver && !isDragActive) {
            e.currentTarget.style.background = 'transparent';
          }
          // Also handle mouse up when leaving
          handleMouseUp();
        }}
      >
        {/* Toggle Icon */}
        <div
          className="project-toggle"
          onClick={() => onToggle(project.id)}
          style={{
            marginRight: 10,
            display: 'flex',
            alignItems: 'center',
            transition: 'transform 0.2s',
            cursor: 'pointer',
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
            fontSize: 18,
            color: isDropOver ? '#1677ff' : '#faad14',
            marginRight: 10,
            transition: 'color 0.2s',
            cursor: 'pointer',
          }}
          onClick={() => onToggle(project.id)}
        />

        {/* Project Name */}
        <div
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
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
                  fontSize: 15,
                  color: isDropOver ? '#1677ff' : '#262626',
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
        {isDropOver && (
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
        {!isDropOver && conversationCount > 0 && (
          <Text
            type="secondary"
            style={{
              fontSize: 14,
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
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
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
                <DraggableProjectConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={currentConversationId === conversation.id}
                  onClick={onConversationClick || (() => {})}
                />
              )}
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '12px 0',
                color: '#8c8c8c',
                fontSize: 12,
              }}
            >
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

export default DraggableDroppableProjectItem;
