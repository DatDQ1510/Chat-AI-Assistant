import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Typography,
  Button,
  List,
  Empty,
  Spin,
  Space,
  Tag,
  Modal,
  Input,
  message as antMessage,
} from 'antd';
import {
  ArrowLeftOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import projectService from '../services/project.service';
import type { Project } from '../types/chat';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ProjectsListPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectsData = await projectService.getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load projects:', error);
      antMessage.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      antMessage.warning('Please enter a project name');
      return;
    }

    setCreating(true);
    try {
      await projectService.createProject(
        newProjectName.trim(),
        newProjectDescription.trim() || undefined
      );
      antMessage.success('Project created successfully');
      setIsCreateModalVisible(false);
      setNewProjectName('');
      setNewProjectDescription('');
      await loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      antMessage.error('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    Modal.confirm({
      title: 'Delete Project',
      content: `Are you sure you want to delete "${projectName}"? All conversations in this project will be unlinked.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await projectService.deleteProject(projectId);
          antMessage.success('Project deleted successfully');
          await loadProjects();
        } catch (error) {
          console.error('Failed to delete project:', error);
          antMessage.error('Failed to delete project');
        }
      },
    });
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" tip="Loading projects..." />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Space size="large">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/dashboard')}
            type="text"
          >
            Back to Dashboard
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FolderOutlined style={{ fontSize: 24, color: '#faad14' }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                All Projects
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </Text>
            </div>
          </div>
        </Space>
        
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalVisible(true)}
        >
          New Project
        </Button>
      </Header>

      {/* Content */}
      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {projects.length === 0 ? (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No projects yet"
                style={{ padding: '60px 0' }}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateModalVisible(true)}
                  size="large"
                >
                  Create Your First Project
                </Button>
              </Empty>
            </Card>
          ) : (
            <List
              grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 2,
                lg: 3,
                xl: 3,
                xxl: 4,
              }}
              dataSource={projects}
              renderItem={(project) => (
                <List.Item>
                  <Card
                    hoverable
                    style={{
                      height: '100%',
                      borderRadius: 12,
                      transition: 'all 0.3s',
                    }}
                    bodyStyle={{ padding: '20px' }}
                    actions={[
                      <Button
                        key="view"
                        type="text"
                        icon={<FolderOpenOutlined />}
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        Open
                      </Button>,
                      <Button
                        key="edit"
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => {
                          // TODO: Implement edit functionality
                          antMessage.info('Edit feature coming soon!');
                        }}
                      />,
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteProject(project.id, project.project_name)}
                      />,
                    ]}
                  >
                    <Card.Meta
                      avatar={
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #faad14 0%, #ffd666 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FolderOutlined style={{ fontSize: 24, color: '#fff' }} />
                        </div>
                      }
                      title={
                        <Text strong style={{ fontSize: 16 }}>
                          {project.project_name}
                        </Text>
                      }
                      description={
                        <div>
                          <Paragraph
                            ellipsis={{ rows: 2 }}
                            type="secondary"
                            style={{ marginBottom: 12, minHeight: 44 }}
                          >
                            {project.description || 'No description'}
                          </Paragraph>
                          <Space size={4}>
                            <Tag color="blue">
                              {new Date(project.updatedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Tag>
                          </Space>
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          )}
        </div>
      </Content>

      {/* Create Project Modal */}
      <Modal
        title="Create New Project"
        open={isCreateModalVisible}
        onOk={handleCreateProject}
        onCancel={() => {
          setIsCreateModalVisible(false);
          setNewProjectName('');
          setNewProjectDescription('');
        }}
        okText="Create"
        confirmLoading={creating}
        okButtonProps={{ disabled: !newProjectName.trim() }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>Project Name *</Text>
            <Input
              placeholder="Enter project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onPressEnter={handleCreateProject}
              maxLength={100}
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <Text strong>Description (optional)</Text>
            <TextArea
              placeholder="Enter project description"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              rows={4}
              maxLength={500}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>
    </Layout>
  );
};

export default ProjectsListPage;
