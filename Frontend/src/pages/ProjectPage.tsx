import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
  Upload,
  message as antMessage,
} from 'antd';
import type { UploadChangeParam } from 'antd/es/upload';
import {
  ArrowLeftOutlined,
  FolderOutlined,
  MessageOutlined,
  UploadOutlined,
  SettingOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import projectService from '../services/project.service';
import conversationService from '../services/conversation.service';
import type { Project, Conversation } from '../types/chat';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      // Load project details
      const projectData = await projectService.getProject(projectId);
      setProject(projectData);
      
      // Load conversations for this project
      const convs = await projectService.getConversationsByProjectId(projectId);
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load project:', error);
      antMessage.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      navigate('/chat');
      return;
    }
    
    loadProject();
  }, [projectId, navigate, loadProject]);

  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  const handleNewChat = async () => {
    if (!projectId) return;
    
    try {
      // Create conversation with default title
      const newConv = await conversationService.createConversation('New Chat', projectId);
      
      antMessage.success('New conversation created');
      navigate(`/chat/${newConv.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      antMessage.error('Failed to create conversation');
    }
  };

  const handleFileUpload = (info: UploadChangeParam) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
    }
    if (info.file.status === 'done') {
      setUploading(false);
      antMessage.success(`${info.file.name} uploaded successfully`);
      // TODO: Implement file storage logic
    } else if (info.file.status === 'error') {
      setUploading(false);
      antMessage.error(`${info.file.name} upload failed`);
    }
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" tip="Loading project..." />
        </Content>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Empty
            description="Project not found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/chat')}>
              Back to Chat
            </Button>
          </Empty>
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
            onClick={() => navigate('/chat')}
            type="text"
          >
            Back to Chat
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FolderOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {project.project_name}
              </Title>
              {project.description && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {project.description}
                </Text>
              )}
            </div>
          </div>
        </Space>
        
        <Space>
          <Button icon={<SettingOutlined />} type="text">
            Settings
          </Button>
        </Space>
      </Header>

      {/* Content */}
      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            
            {/* Conversations Section */}
            <Card
              title={
                <Space>
                  <MessageOutlined />
                  <span>Conversations</span>
                  <Tag color="blue">{conversations.length}</Tag>
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleNewChat}
                  size="small"
                >
                  New Chat
                </Button>
              }
              style={{ height: 'fit-content' }}
            >
              {conversations.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No conversations yet"
                  style={{ padding: '40px 0' }}
                >
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleNewChat}>
                    Create First Conversation
                  </Button>
                </Empty>
              ) : (
                <List
                  dataSource={conversations}
                  renderItem={(conv) => (
                    <List.Item
                      key={conv.id}
                      onClick={() => handleConversationClick(conv.id)}
                      style={{
                        cursor: 'pointer',
                        padding: '12px 16px',
                        borderRadius: 8,
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f5f7fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <List.Item.Meta
                        avatar={<MessageOutlined style={{ fontSize: 18, color: '#1890ff' }} />}
                        title={conv.title}
                        description={
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(conv.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>

            {/* Files & Settings Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Files Upload */}
              <Card
                title={
                  <Space>
                    <UploadOutlined />
                    <span>Project Files</span>
                  </Space>
                }
              >
                <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                  Upload files to provide context for all conversations in this project.
                </Paragraph>
                
                <Upload
                  name="file"
                  multiple
                  onChange={handleFileUpload}
                  showUploadList={true}
                  disabled={uploading}
                  beforeUpload={() => {
                    // TODO: Implement actual upload logic
                    antMessage.info('File upload feature coming soon!');
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />} loading={uploading} block>
                    {uploading ? 'Uploading...' : 'Upload Files'}
                  </Button>
                </Upload>

                <Divider />
                
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No files uploaded yet"
                  style={{ margin: '20px 0' }}
                />
              </Card>

              {/* Custom Settings Placeholder */}
              <Card
                title={
                  <Space>
                    <SettingOutlined />
                    <span>Project Settings</span>
                  </Space>
                }
              >
                <Paragraph type="secondary" style={{ fontSize: 13 }}>
                  Configure project-specific AI behavior and preferences.
                </Paragraph>
                
                <Button type="dashed" block disabled>
                  Custom Instructions (Coming Soon)
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default ProjectPage;
