import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Typography, Tooltip, Button, Dropdown, Input, Modal } from 'antd';
import type { MenuProps } from 'antd';
import {
  FolderOutlined,
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import type { ProjectItemProps } from '../../types/chat';

const { Text } = Typography;

const DRAG_THRESHOLD = 5; // Simple threshold như conversation

const DraggableDroppableProjectItem: React.FC<ProjectItemProps> = ({
  project,
  isActive = false,
  onClick,
  onDelete,
  onRename,
  onNewChat,
}) => {
  const navigate = useNavigate();
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
    disabled: !isDragActive, // Only enable when intentional drag
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
      target.closest('input')
    ) {
      return;
    }

    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    setIsDragActive(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mouseDownPosRef.current || hasMovedRef.current) return;

    const deltaX = Math.abs(e.clientX - mouseDownPosRef.current.x);
    const deltaY = Math.abs(e.clientY - mouseDownPosRef.current.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > DRAG_THRESHOLD) {
      hasMovedRef.current = true;
      setIsDragActive(true);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragActive(false);
    mouseDownPosRef.current = null;
    hasMovedRef.current = false;
  }, []);

  const handleProjectClick = useCallback(() => {
    // Call parent onClick if provided
    onClick?.();
  }, [onClick]);

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
      key: 'viewProject',
      label: 'View Project',
      icon: <FolderOpenOutlined />,
      onClick: () => navigate(`/project/${project.id}`),
    },
    {
      key: 'newChat',
      label: 'New Chat',
      icon: <PlusOutlined />,
      onClick: () => onNewChat?.(project.id),
    },
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

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'pointer',
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
        onClick={handleProjectClick}
        {...(isDragActive ? { ...attributes, ...listeners } : {})}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px',
          borderRadius: 8,
          transition: 'all 0.2s',
          cursor: 'pointer',
          background: isActive
            ? '#e6f4ff' // Active state - blue background
            : isDropOver
            ? '#e6f4ff'
            : 'transparent',
          border: isActive
            ? '2px solid #1677ff' // Active state - blue border
            : isDropOver 
            ? '2px dashed #1677ff' 
            : '2px solid transparent',
          boxShadow: isActive || isDropOver
            ? '0 0 8px rgba(22, 119, 255, 0.3)'
            : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isDropOver && !isDragActive && !isActive) {
            e.currentTarget.style.background = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDropOver && !isDragActive && !isActive) {
            e.currentTarget.style.background = 'transparent';
          }
          // Also handle mouse up when leaving
          handleMouseUp();
        }}
      >
        {/* Folder Icon */}
        <FolderOutlined
          style={{
            fontSize: 18,
            color: isDropOver ? '#1677ff' : '#faad14',
            marginRight: 10,
            transition: 'color 0.2s',
          }}
        />

        {/* Project Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
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

      <style>
        {`
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
