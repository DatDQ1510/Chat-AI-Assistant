import React, { useCallback } from 'react';
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { message } from 'antd';
import conversationService from '../../services/conversation.service';

interface DragAndDropProviderProps {
  children: React.ReactNode;
  onConversationMoved?: (conversationId: string, projectId: string) => void;
  onProjectUpdate?: (projectId: string) => Promise<void>;
  onRefreshAllProjects?: () => Promise<void>; // ✅ New: refresh all expanded projects
}

const DragAndDropProvider: React.FC<DragAndDropProviderProps> = ({ 
  children, 
  onConversationMoved,
  onProjectUpdate,
  onRefreshAllProjects, // ✅ New callback
}) => {
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) return;

      const draggedConversation = active.data.current?.conversation;
      const targetProject = over.data.current?.project;
      const targetType = over.data.current?.type;

      // Validate drag type
      if (active.data.current?.type !== 'conversation') {
        return;
      }

      if (!draggedConversation) {

        return;
      }

      const conversationId = draggedConversation.id;
      const sourceProjectId = draggedConversation.project_id;

      // Case 1: Drop into conversations-list (unlink from project)
      if (targetType === 'conversations-list') {
        // Already in main list (no project) - check if sourceProjectId is null/undefined
        if (!sourceProjectId || sourceProjectId === null) {
          message.info('Conversation is already in main list');
          return;
        }

        try {
          // Set project_id to null
          await conversationService.updateConversationProject(conversationId, null);
          
          message.success(`Moved "${draggedConversation.title}" to main list`);

          // Notify parent to refresh
          onConversationMoved?.(conversationId, ''); // Empty string for null project

          // Refresh all projects to remove conversation from old project
          if (onRefreshAllProjects) {
            await onRefreshAllProjects();
          } else if (onProjectUpdate && sourceProjectId) {
            await onProjectUpdate(sourceProjectId);
          }
        } catch {
          message.error('Failed to move conversation to main list');
        }
        return;
      }

      // Case 2: Drop into project
      if (targetType !== 'project' || !targetProject) {
        return;
      }

      const projectId = targetProject.id;

      // ✅ Check if trying to move to same project (both must have values and be equal)
      if (sourceProjectId && sourceProjectId === projectId) {
        message.info('Conversation is already in this project');
        return;
      }

      try {
        // Call API to update conversation's project
        await conversationService.updateConversationProject(conversationId, projectId);

        message.success(
          `Moved "${draggedConversation.title}" to project "${targetProject.project_name}"`
        );

        // ✅ First, notify parent to refresh conversation list (this updates the conversation data)
        onConversationMoved?.(conversationId, projectId);

        // ✅ Refresh ALL expanded projects (simple and effective!)
        if (onRefreshAllProjects) {

          await onRefreshAllProjects();
        } else if (onProjectUpdate) {
          // Fallback: refresh specific projects
          await onProjectUpdate(projectId);
          
          if (sourceProjectId && sourceProjectId !== projectId) {
            await onProjectUpdate(sourceProjectId);
          }
        }
      } catch {
        message.error('Failed to move conversation to project');
      }
    },
    [onConversationMoved, onProjectUpdate, onRefreshAllProjects]
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
