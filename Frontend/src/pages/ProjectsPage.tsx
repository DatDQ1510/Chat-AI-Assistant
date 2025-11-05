import React, { useState, useEffect } from 'react';
import { Layout, Card, Typography, Button, Space, Avatar, Modal, Form, Input, message, Spin, Empty } from 'antd';
import { UserOutlined, LogoutOutlined, MessageOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import projectService from '../services/project.service';
import type { Project } from '../types/chat';
import '../components/Dashboard.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await projectService.getProjects();
      setProjects(projectsData);
    } catch (error) {
      message.error('Failed to load projects');
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    navigate('/signin');
  };

  const handleCreateProject = async (values: { project_name: string; description?: string }) => {
    try {
      await projectService.createProject(values.project_name, values.description);
      message.success('Project created successfully!');
      setCreateModalVisible(false);
      form.resetFields();
      loadProjects();
    } catch (error) {
      message.error('Failed to create project');
      console.error('Error creating project:', error);
    }
  };

  const handleEditProject = async (values: { project_name: string; description?: string }) => {
    if (!editingProject) return;

    try {
      await projectService.updateProject(editingProject.id, values.project_name, values.description);
      message.success('Project updated successfully!');
      setEditingProject(null);
      form.resetFields();
      loadProjects();
    } catch (error) {
      message.error('Failed to update project');
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    Modal.confirm({
      title: 'Delete Project',
      content: 'Are you sure you want to delete this project? All conversations in this project will be deleted.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await projectService.deleteProject(projectId);
          message.success('Project deleted successfully!');
          loadProjects();
        } catch (error) {
          message.error('Failed to delete project');
          console.error('Error deleting project:', error);
        }
      },
    });
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const headerStyle: React.CSSProperties = {
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
  };

  const contentStyle: React.CSSProperties = {
    padding: '24px',
    minHeight: 'calc(100vh - 64px)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  };

  return (
    <Layout>
      <Header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <MessageOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            AI Chatbot Assistant
          </Title>
        </div>

        <Space>
          <Button type="link" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
          <Avatar icon={<UserOutlined />} />
          <Text strong>Welcome back!</Text>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Space>
      </Header>

      <Content style={contentStyle}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Card style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={2}>Your Projects</Title>
                <Text type="secondary">
                  Organize your conversations into projects for better management and collaboration.
                </Text>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => setCreateModalVisible(true)}
              >
                Create Project
              </Button>
            </div>
          </Card>

          {loading ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>
                  <Text>Loading projects...</Text>
                </div>
              </div>
            </Card>
          ) : projects.length === 0 ? (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Title level={4}>No projects yet</Title>
                    <Text type="secondary">
                      Create your first project to start organizing your conversations.
                    </Text>
                  </div>
                }
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  Create Your First Project
                </Button>
              </Empty>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
              {projects.map((project) => (
                <Card
                  key={project.id}
                  hoverable
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleViewProject(project.id)}
                  actions={[
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                        form.setFieldsValue({
                          project_name: project.project_name,
                          description: project.description,
                        });
                      }}
                    >
                      Edit
                    </Button>,
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                    >
                      Delete
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    avatar={<FolderOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                    title={<Title level={4} style={{ margin: 0 }}>{project.project_name}</Title>}
                    description={
                      <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                          {project.description || 'No description'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Created: {new Date(project.createdAt).toLocaleDateString()}
                        </Text>
                      </div>
                    }
                  />
                </Card>
              ))}
            </div>
          )}
        </div>
      </Content>

      {/* Create Project Modal */}
      <Modal
        title="Create New Project"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateProject}
        >
          <Form.Item
            name="project_name"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description (Optional)"
          >
            <TextArea
              placeholder="Enter project description"
              rows={3}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Project
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        title="Edit Project"
        open={!!editingProject}
        onCancel={() => {
          setEditingProject(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditProject}
        >
          <Form.Item
            name="project_name"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description (Optional)"
          >
            <TextArea
              placeholder="Enter project description"
              rows={3}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setEditingProject(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Update Project
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ProjectsPage;