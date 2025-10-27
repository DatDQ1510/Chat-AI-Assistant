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
      const sourceProjectId = draggedConversation.project_id; // ✅ Get source project before moving

      console.log('🔍 Drag details:', {
        conversationId,
        conversationTitle: draggedConversation.title,
        sourceProjectId,
        targetProjectId: projectId,
        fullConversation: draggedConversation
      });

      // ✅ Check if trying to move to same project
      if (sourceProjectId === projectId) {
        console.log('ℹ️ Conversation already in this project');
        message.info('Conversation is already in this project');
        return;
      }

      console.log(`📌 Moving conversation "${draggedConversation.title}" to project "${targetProject.project_name}"`);
      if (sourceProjectId) {
        console.log(`   From project: ${sourceProjectId}`);
      }

      try {
        // Call API to update conversation's project
        const updatedConversation = await conversationService.updateConversationProject(conversationId, projectId);
        
        console.log('✅ API response - updated conversation:', updatedConversation);

        message.success(
          `Moved "${draggedConversation.title}" to project "${targetProject.project_name}"`
        );

        // ✅ First, notify parent to refresh conversation list (this updates the conversation data)
        onConversationMoved?.(conversationId, projectId);

        // ✅ Refresh ALL expanded projects (simple and effective!)
        if (onRefreshAllProjects) {
          console.log('🔄 Refreshing ALL expanded projects to ensure sync...');
          await onRefreshAllProjects();
        } else if (onProjectUpdate) {
          // Fallback: refresh specific projects
          console.log('🔄 Refreshing target project:', projectId);
          await onProjectUpdate(projectId);
          
          if (sourceProjectId && sourceProjectId !== projectId) {
            console.log('🔄 Refreshing source project:', sourceProjectId);
            await onProjectUpdate(sourceProjectId);
          } else if (!sourceProjectId) {
            console.log('ℹ️ No source project to refresh (moved from main list)');
          } else {
            console.log('ℹ️ Source and target are the same project');
          }
        }
      } catch (error) {
        console.error('Failed to move conversation:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to move conversation to project';
        message.error(errorMessage);
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
