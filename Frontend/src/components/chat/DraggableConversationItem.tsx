import { useRef, useCallback, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import ConversationItem from './ConversationItem';
import type { Conversation } from '../../types/chat';

interface DraggableConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: (id: string) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onUpdateTag?: (id: string, tag: string | null) => Promise<void>;
}

const DRAG_THRESHOLD = 10;

const DraggableConversationItem: React.FC<DraggableConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
  onDelete,
  onRename,
  onUpdateTag,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: conversation.id,
    data: {
      type: 'conversation',
      conversation,
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
      console.log('🎯 Drag activated for:', conversation.title);
    }
  }, [conversation.title]);

  const handleMouseUp = useCallback(() => {
    setIsDragActive(false);
    mouseDownPosRef.current = null;
    hasMovedRef.current = false;
  }, []);

  const handleClick = useCallback(() => {
    if (!hasMovedRef.current && !isDragging) {
      onClick(conversation.id);
    }
  }, [onClick, conversation.id, isDragging]);

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : isDragActive ? 'grabbing' : 'pointer',
    transition: 'opacity 0.2s ease',
    userSelect: 'none' as const,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      {...(isDragActive ? { ...attributes, ...listeners } : {})} 
    >
      <ConversationItem
        conversation={conversation}
        isActive={isActive}
        onClick={() => {}}
        onDelete={onDelete}
        onRename={onRename}
        onUpdateTag={onUpdateTag}
      />
    </div>
  );
};

export default DraggableConversationItem;

