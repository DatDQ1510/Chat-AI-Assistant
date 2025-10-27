import React, { useCallback } from 'react';
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { message } from 'antd';
import conversationService from '../../services/conversation.service';

interface DragAndDropProviderProps {
  children: React.ReactNode;
  onConversationMoved?: (conversationId: string, projectId: string) => void;
  onProjectUpdate?: (projectId: string) => Promise<void>; 
}

const DragAndDropProvider: React.FC<DragAndDropProviderProps> = ({ 
  children, 
  onConversationMoved,
  onProjectUpdate,
}) => {
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) return;

      const draggedConversation = active.data.current?.conversation;
      const targetProject = over.data.current?.project;

      // Validate: only allow conversation → project drops
      if (
        active.data.current?.type !== 'conversation' ||
        over.data.current?.type !== 'project'
      ) {
        return;
      }

      if (!draggedConversation || !targetProject) {
        console.error('Invalid drag data:', { draggedConversation, targetProject });
        return;
      }

      const conversationId = draggedConversation.id;
      const projectId = targetProject.id;

      console.log(`📌 Moving conversation "${draggedConversation.title}" to project "${targetProject.project_name}"`);

      try {
        // Call API to update conversation's project
        await conversationService.updateConversationProject(conversationId, projectId);

        message.success(
          `Moved "${draggedConversation.title}" to project "${targetProject.project_name}"`
        );

        // ✅ Refresh project conversations immediately
        if (onProjectUpdate) {
          await onProjectUpdate(projectId);
        }

        // Notify parent to refresh conversation list
        onConversationMoved?.(conversationId, projectId);
      } catch (error) {
        console.error('Failed to move conversation:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to move conversation to project';
        message.error(errorMessage);
      }
    },
    [onConversationMoved, onProjectUpdate]
  );

  return (
    <DndContext collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      {children}
      <DragOverlay>
        {/* Optional: Show dragged item preview */}
        <div
          style={{
            padding: '8px 12px',
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '2px solid #1677ff',
            cursor: 'grabbing',
          }}
        >
          Dragging conversation...
        </div>
      </DragOverlay>
    </DndContext>
  );
};

export default DragAndDropProvider;
