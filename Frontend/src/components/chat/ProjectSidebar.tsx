import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Button, Typography, Spin, Empty, Modal, Input, Divider } from 'antd';
import {
  DownOutlined,
  RightOutlined,
  FolderAddOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useProjects } from '../../hooks/useProjects';
import DraggableDroppableProjectItem from './DraggableDroppableProjectItem'; // ✅ New component with drag support
import DraggableConversationItem from './DraggableConversationItem'; // ✅ Import for rendering conversations
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;
const { TextArea } = Input;

interface ProjectSidebarProps {
  currentConversationId?: string | null;
}

// ✅ Export imperative handle type
export interface ProjectSidebarRef {
  refreshProject: (projectId: string) => Promise<void>;
  refreshAllProjects: () => Promise<void>; // ✅ Add new method
}

const ProjectSidebar = forwardRef<ProjectSidebarRef, ProjectSidebarProps>(
  ({ currentConversationId }, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const {
    projects,
    loading,
    activeProjectId,
    fetchProjects,
    createProject,
    deleteProject,
    updateProject,
    selectProject,
    fetchProjectConversations, // ✅ Get refresh function
    refreshActiveProject, // ✅ Get refresh active function
  } = useProjects();

  // ✅ Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    refreshProject: async (projectId: string) => {
      await fetchProjectConversations(projectId);
    },
    refreshAllProjects: async () => {
      await refreshActiveProject();
    },
  }), [fetchProjectConversations, refreshActiveProject]);

  // Load projects on mount
  useEffect(() => {
    if (isExpanded && projects.length === 0 && !loading) {
      fetchProjects();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const handleToggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      return;
    }

    setCreating(true);
    try {
      await createProject(newProjectName.trim(), newProjectDescription.trim() || undefined);
      setIsCreateModalVisible(false);
      setNewProjectName('');
      setNewProjectDescription('');
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleNewChat = async (projectId: string) => {
    try {
      const conversationService = await import('../../services/conversation.service');
      const conversation_name = 'New conversation';
      const newConv = await conversationService.default.createConversation(conversation_name, projectId);
      navigate(`/chat/${newConv.id}`);
    } catch (error) {
      console.error('Failed to create new conversation in project:', error);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  return (
    <div
      style={{
        marginTop: 8,
        marginBottom: 8,
      }}
    >
      {/* Header - Always Visible */}
      <div
        onClick={handleToggleSidebar}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px', // ✅ Slightly increased padding
          cursor: 'pointer',
          borderRadius: 8,
          transition: 'all 0.2s',
          background: isExpanded ? '#f0f2f5' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.background = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {/* Toggle Arrow */}
        <div style={{ marginRight: 10, transition: 'transform 0.2s' }}>
          {isExpanded ? (
            <DownOutlined style={{ fontSize: 14, color: '#8c8c8c' }} />
          ) : (
            <RightOutlined style={{ fontSize: 14, color: '#8c8c8c' }} />
          )}
        </div>

        {/* Folder Icon */}
        <FolderOutlined
          style={{
            fontSize: 20,
            color: '#faad14',
            marginRight: 12,
          }}
        />

        {/* Title */}
        <Text
          strong
          style={{
            fontSize: 18,
            color: '#262626',
            flex: 1,
          }}
        >
          Projects
        </Text>

        {/* Project Count Badge */}
        {projects.length > 0 && (
          <div
            style={{
              background: '#e6f4ff',
              color: '#2d83faff',
              borderRadius: 10,
              padding: '3px 10px',
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            {projects.length}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          style={{
            marginTop: 8,
            paddingLeft: 8,
            paddingRight: 8,
            animation: 'slideDown 0.2s ease-out',
          }}
        >
          {/* New Project Button */}
          <Button
            type="dashed"
            icon={<FolderAddOutlined />}
            onClick={() => setIsCreateModalVisible(true)}
            block
            style={{
              marginBottom: 12,
              borderRadius: 8,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            New Project
          </Button>

          <Divider style={{ margin: '8px 0' }} />

          {/* Loading State */}
          {loading && projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Spin />
              <div style={{ marginTop: 12, color: '#8c8c8c', fontSize: 13 }}>
                Loading projects...
              </div>
            </div>
          ) : projects.length === 0 ? (
            /* Empty State */
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text type="secondary" style={{ fontSize: 13 }}>
                  No projects yet
                  <br />
                  Create your first project
                </Text>
              }
              style={{ padding: '20px 0' }}
            />
          ) : (
            /* Projects List - Scroll chung cho tất cả */
            <div style={{ 
              maxHeight: '500px', 
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: 4,
            }}>
              {projects.map((project) => {
                const isActive = activeProjectId === project.id;
                const conversations = project.conversations || [];
                
                return (
                  <div key={project.id}>
                    {/* Project Item */}
                    <DraggableDroppableProjectItem
                      project={project}
                      isActive={isActive}
                      onClick={() => selectProject(project.id)}
                      onDelete={deleteProject}
                      onRename={updateProject}
                      onNewChat={handleNewChat}
                    />
                    
                    {/* Conversations - Render flat below project when active */}
                    {isActive && conversations.length > 0 && (
                      <div style={{ paddingLeft: 24, marginTop: 4, marginBottom: 8 }}>
                        {conversations.map((conversation) => (
                          <DraggableConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            isActive={conversation.id === currentConversationId}
                            onClick={() => handleConversationClick(conversation.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        title="Create New Project"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          setNewProjectName('');
          setNewProjectDescription('');
        }}
        onOk={handleCreateProject}
        okText="Create"
        cancelText="Cancel"
        confirmLoading={creating}
        okButtonProps={{ disabled: !newProjectName.trim() }}
      >
        <div style={{ marginTop: 16 }}>
          <Text strong style={{ fontSize: 14 }}>
            Project Name <span style={{ color: 'red' }}>*</span>
          </Text>
          <Input
            placeholder="Enter project name..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onPressEnter={handleCreateProject}
            style={{ marginTop: 8, marginBottom: 16 }}
            maxLength={100}
          />

          <Text strong style={{ fontSize: 14 }}>
            Description (Optional)
          </Text>
          <TextArea
            placeholder="Enter project description..."
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            rows={3}
            style={{ marginTop: 8 }}
            maxLength={500}
          />
        </div>
      </Modal>

      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              max-height: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              max-height: 600px;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
});

ProjectSidebar.displayName = 'ProjectSidebar';

export default ProjectSidebar;
