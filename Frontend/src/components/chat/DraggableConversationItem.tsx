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
}

const DRAG_THRESHOLD = 10; // pixels to move before activating drag

const DraggableConversationItem: React.FC<DraggableConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
  onDelete,
  onRename,
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
    disabled: !isDragActive, // ✅ Only enable when user moves enough
  });

  // ✅ Track mouse down position
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    setIsDragActive(false);
  }, []);

  // ✅ Handle mouse move - Enable drag if moved enough
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mouseDownPosRef.current || hasMovedRef.current) return;

    const deltaX = Math.abs(e.clientX - mouseDownPosRef.current.x);
    const deltaY = Math.abs(e.clientY - mouseDownPosRef.current.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // If moved more than threshold, activate drag mode
    if (distance > DRAG_THRESHOLD) {
      hasMovedRef.current = true;
      setIsDragActive(true);
      console.log('🎯 Drag activated for:', conversation.title);
    }
  }, [conversation.title]);

  // ✅ Handle mouse up - Reset drag mode
  const handleMouseUp = useCallback(() => {
    setIsDragActive(false);
    mouseDownPosRef.current = null;
    hasMovedRef.current = false;
  }, []);

  // ✅ Handle click - Only fire if didn't drag
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
      {...(isDragActive ? { ...attributes, ...listeners } : {})} // ✅ Only attach when drag active
    >
      <ConversationItem
        conversation={conversation}
        isActive={isActive}
        onClick={() => {}} // ✅ Disable inner onClick, use outer wrapper
        onDelete={onDelete}
        onRename={onRename}
      />
    </div>
  );
};

export default DraggableConversationItem;

