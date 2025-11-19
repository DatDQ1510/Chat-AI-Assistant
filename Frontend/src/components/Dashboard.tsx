import React from 'react';
import { Layout, Card, Typography, Button, Space, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined, MessageOutlined, FolderOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication state
    navigate('/signin');
  };

  const handleStartChat = () => {
    navigate('/chat');
  };

  const handleViewProjects = () => {
    navigate('/chat'); // Projects are in chat sidebar
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
    padding: '48px 24px',
    minHeight: 'calc(100vh - 64px)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  };

  const cardStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  };

  const welcomeCardStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '32px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Card style={welcomeCardStyle}>
            <Title level={2} style={{ marginBottom: '12px' }}>Welcome to Your Dashboard!</Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              You have successfully signed in. Your AI chat assistant is ready to help!
            </Text>
          </Card>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '24px',
            alignItems: 'stretch',
          }}>
            <Card title="Quick Start" hoverable style={cardStyle}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Text style={{ marginBottom: '16px', display: 'block' }}>
                  Start chatting with your AI assistant right away.
                </Text>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleStartChat}
                  block
                >
                  Start Chat
                </Button>
              </div>
            </Card>
            
            <Card title="Projects" hoverable style={cardStyle}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Text style={{ marginBottom: '16px', display: 'block' }}>
                  Access your organized project workspaces
                </Text>
                <Button 
                  type="primary"
                  size="large"
                  block 
                  onClick={handleViewProjects}
                  icon={<FolderOutlined />}
                >
                  View All Projects
                </Button>
              </div>
            </Card>
            
            <Card title="Settings" hoverable style={cardStyle}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Text style={{ marginBottom: '16px', display: 'block' }}>
                  Customize your chat experience and preferences.
                </Text>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => navigate('/settings')}
                  block
                >
                  View Settings
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default Dashboard;