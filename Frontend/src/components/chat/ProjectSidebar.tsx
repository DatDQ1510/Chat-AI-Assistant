import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Button, Typography, Spin, Empty, Modal, Input, Divider } from 'antd';
import {
  DownOutlined,
  RightOutlined,
  FolderAddOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useProjects } from '../../hooks/useProjects';
import DroppableProjectItem from './DroppableProjectItem';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;
const { TextArea } = Input;

interface ProjectSidebarProps {
  currentConversationId?: string | null;
}

// ✅ Export imperative handle type
export interface ProjectSidebarRef {
  refreshProject: (projectId: string) => Promise<void>;
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
    expandedProjects,
    fetchProjects,
    createProject,
    deleteProject,
    updateProject,
    toggleProject,
    fetchProjectConversations, // ✅ Get refresh function
  } = useProjects();

  // ✅ Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    refreshProject: async (projectId: string) => {
      await fetchProjectConversations(projectId);
    },
  }), [fetchProjectConversations]);

  // Load projects on mount
  useEffect(() => {
    if (isExpanded && projects.length === 0 && !loading) {
      fetchProjects();
    }
  }, [isExpanded, projects.length, loading, fetchProjects]);

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
            fontSize: 16,
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
              color: '#1677ff',
              borderRadius: 10,
              padding: '3px 10px',
              fontSize: 13,
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
            /* Projects List */
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {projects.map((project) => (
                <DroppableProjectItem
                  key={project.id}
                  project={project}
                  isExpanded={expandedProjects.has(project.id)}
                  onToggle={toggleProject}
                  onDelete={deleteProject}
                  onRename={updateProject}
                  onConversationClick={handleConversationClick}
                  currentConversationId={currentConversationId}
                />
              ))}
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
