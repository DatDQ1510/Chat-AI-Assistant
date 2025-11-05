import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ChatContainer from './ChatContainer';
import ProjectView from './ProjectView';
import DragAndDropProvider from './DragAndDropProvider';

/**
 * ChatLayout - Wrapper to handle routing between Chat and ProjectView
 * - /chat or /chat/:chatId → Full ChatContainer
 * - /project/:projectId → ProjectView only
 */
const ChatLayout: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're viewing a project
  const isProjectView = location.pathname.startsWith('/project/') && projectId;

  if (isProjectView) {
    // Show only ProjectView (full screen with integrated sidebar)
    return (
      <DragAndDropProvider>
        <ProjectView
          onConversationSelect={(conversationId) => {
            navigate(`/chat/${conversationId}`);
          }}
        />
      </DragAndDropProvider>
    );
  }

  // Default: Show full ChatContainer (with its own sidebar)
  return <ChatContainer />;
};

export default ChatLayout;
