import React, { useRef, useCallback, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { List, Typography, Tooltip } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import type { Conversation } from '../../types/chat';

const { Text } = Typography;

interface DraggableProjectConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: (id: string) => void;
}

const DRAG_THRESHOLD = 5; // Same as other draggables

const DraggableProjectConversationItem: React.FC<DraggableProjectConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `project-conversation-${conversation.id}`,
    data: {
      type: 'conversation',
      conversation, // This includes project_id now
    },
    disabled: !isDragActive,
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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

  const handleClick = useCallback(() => {
    // Only trigger click if didn't drag
    if (!hasMovedRef.current && !isDragging) {
      onClick(conversation.id);
    }
  }, [onClick, conversation.id, isDragging]);

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'pointer',
    transition: 'opacity 0.2s ease',
    userSelect: 'none' as const,
  };

  return (
    <List.Item
      ref={setNodeRef}
      style={{
        ...style,
        padding: '10px 16px',
        borderRadius: 8,
        transition: 'all 0.2s',
        background: isActive ? '#e6f4ff' : 'transparent',
        border: isActive ? '1px solid #91caff' : '1px solid transparent',
        marginBottom: 4,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = '#f5f5f5';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
      {...(isDragActive ? { ...attributes, ...listeners } : {})}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          minWidth: 0,
        }}
      >
        <MessageOutlined
          style={{
            fontSize: 16,
            color: '#1677ff',
            marginRight: 10,
            flexShrink: 0,
          }}
        />
        <Tooltip title={conversation.title} placement="right">
          <Text
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: isActive ? '#1677ff' : '#262626',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {conversation.title}
          </Text>
        </Tooltip>
      </div>
    </List.Item>
  );
};

export default DraggableProjectConversationItem;
