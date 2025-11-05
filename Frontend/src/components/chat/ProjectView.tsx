import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Button,
  List,
  Empty,
  Spin,
  Typography,
  Space,
  Card,
  Upload,
  message as antMessage,
  Tag,
} from 'antd';
import type { UploadChangeParam } from 'antd/es/upload';
import {
  SendOutlined,
  SettingOutlined,
  UploadOutlined,
  MessageOutlined,
  FolderOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useSocket } from '../../contexts/SocketContext'; // ✅ Import socket
import projectService from '../../services/project.service';
import conversationService from '../../services/conversation.service';
import type { Project, Conversation } from '../../types/chat';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ProjectViewProps {
  onConversationSelect?: (conversationId: string) => void;
}

const ProjectView: React.FC<ProjectViewProps> = ({ onConversationSelect }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const socket = useSocket(); // ✅ Get socket instance
  
  const [project, setProject] = useState<Project | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      // Load project details
      const projectData = await projectService.getProject(projectId);
      setProject(projectData);
    } catch (error) {
      console.error('Failed to load project:', error);
      antMessage.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadConversations = useCallback(async () => {
    if (!projectId) return;
    
    setLoadingConversations(true);
    try {
      const convs = await projectService.getConversationsByProjectId(projectId);
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      antMessage.error('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      navigate('/chat');
      return;
    }
    
    loadProject();
    loadConversations();
  }, [projectId, navigate, loadProject, loadConversations]);

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !projectId || !socket) return;
    
    setCreatingChat(true);
    const userMessage = chatInput.trim();
    
    try {
      // STEP 1: Create conversation with temporary title
      const conversation_name = chatInput.length > 30 ? chatInput.slice(0, 30) + '...' : chatInput;
      const newConv = await conversationService.createConversation(conversation_name, projectId);

      console.log('✅ Conversation created:', newConv.id);
      
      // STEP 2: Join conversation room
      socket.emit('join_conversation', newConv.id);
      
      // STEP 3: Clear input immediately
      setChatInput('');
      
      // STEP 4: Navigate to conversation
      if (onConversationSelect) {
        onConversationSelect(newConv.id);
      } else {
        navigate(`/chat/${newConv.id}`);
      }
      
      // STEP 5: Send message via socket (with callback to handle success/error)
      // Wait a bit for navigation to complete
      setTimeout(() => {
        socket.emit('send_message', {
          conversation_id: newConv.id,
          content: userMessage,
        }, (response: { success: boolean; error?: string }) => {
          if (response.success) {
            console.log('✅ Message sent successfully');
            antMessage.success('Message sent!');
          } else {
            console.error('❌ Failed to send message:', response.error);
            antMessage.error(`Failed to send message: ${response.error || 'Unknown error'}`);
          }
        });
      }, 300); // 300ms delay for navigation + UI update
      
    } catch (error) {
      console.error('Failed to create conversation:', error);
      antMessage.error('Failed to create conversation');
      setChatInput(userMessage); // Restore input on error
    } finally {
      setCreatingChat(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    } else {
      navigate(`/chat/${conversationId}`);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await conversationService.deleteConversation(conversationId);
      antMessage.success('Conversation deleted');
      await loadConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      antMessage.error('Failed to delete conversation');
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

  const handleProjectSettings = () => {
    antMessage.info('Project settings coming soon!');
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          background: '#fafafa',
        }}
      >
        <Spin size="large" tip="Loading project..." />
      </div>
    );
  }

  if (!project) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          background: '#fafafa',
        }}
      >
        <Empty
          description="Project not found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate('/chat')}>
            Back to Chat
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#fafafa',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#fff',
          padding: '16px 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space size="middle">
          <FolderOutlined style={{ fontSize: 28, color: '#faad14' }} />
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
        </Space>
        
        <Space>
          <Button
            icon={<UploadOutlined />}
            onClick={() => document.getElementById('project-file-upload')?.click()}
            loading={uploading}
          >
            Add Files
          </Button>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={handleProjectSettings}
          >
            Project Settings
          </Button>
        </Space>
      </div>

      {/* Hidden File Upload */}
      <Upload
        id="project-file-upload"
        name="file"
        multiple
        onChange={handleFileUpload}
        showUploadList={false}
        beforeUpload={() => {
          antMessage.info('File upload feature coming soon!');
          return false;
        }}
        style={{ display: 'none' }}
      >
        <div id="project-file-upload" />
      </Upload>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: 24,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* Chat Input Card */}
        <Card
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            borderRadius: 12,
          }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageOutlined style={{ fontSize: 18, color: '#1890ff' }} />
              <Title level={5} style={{ margin: 0 }}>
                Start a New Conversation
              </Title>
            </div>
            
            <TextArea
              placeholder="Type your message to create a new conversation..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleChatSubmit();
                }
              }}
              autoSize={{ minRows: 3, maxRows: 6 }}
              disabled={creatingChat}
              style={{ fontSize: 15 }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleChatSubmit}
                loading={creatingChat}
                disabled={!chatInput.trim()}
                size="large"
              >
                Create & Start Chat
              </Button>
            </div>
          </Space>
        </Card>

        {/* Conversations List */}
        <Card
          title={
            <Space>
              <MessageOutlined style={{ color: '#1890ff' }} />
              <span>Conversations</span>
              <Tag color="blue">{conversations.length}</Tag>
            </Space>
          }
          extra={
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setChatInput('New conversation')}
            >
              Quick Create
            </Button>
          }
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            borderRadius: 12,
          }}
        >
          {loadingConversations ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin tip="Loading conversations..." />
            </div>
          ) : conversations.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No conversations yet"
              style={{ padding: '40px 0' }}
            >
              <Text type="secondary">
                Use the input above to start your first conversation
              </Text>
            </Empty>
          ) : (
            <List
              dataSource={conversations}
              renderItem={(conv) => (
                <List.Item
                  key={conv.id}
                  style={{
                    cursor: 'pointer',
                    padding: '16px',
                    borderRadius: 8,
                    transition: 'background 0.2s',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f5f7fa';
                    e.currentTarget.style.borderColor = '#e8e8e8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onClick={() => handleConversationClick(conv.id)}
                      >
                        <MessageOutlined style={{ fontSize: 18, color: '#fff' }} />
                      </div>
                    }
                    title={
                      <Text
                        strong
                        style={{ fontSize: 15 }}
                        onClick={() => handleConversationClick(conv.id)}
                      >
                        {conv.title}
                      </Text>
                    }
                    description={
                      <Space size={4}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(conv.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          •
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(conv.updatedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProjectView;
