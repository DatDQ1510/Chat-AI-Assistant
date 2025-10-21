import React from 'react';
import { Layout, Card, Typography, Button, Space, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined, MessageOutlined } from '@ant-design/icons';
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
          <Card style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Title level={2}>Welcome to Your Dashboard!</Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              You have successfully signed in. Your AI chat assistant is ready to help!
            </Text>
          </Card>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <Card title="Quick Start" hoverable>
              <Text>Start chatting with your AI assistant right away.</Text>
              <br />
              <Button type="primary" style={{ marginTop: '16px' }} onClick={handleStartChat}>
                Start Chat
              </Button>
            </Card>
            
            <Card title="Settings" hoverable>
              <Text>Customize your chat experience and preferences.</Text>
              <br />
              <Button type="link" style={{ marginTop: '16px' }} onClick={() => navigate('/settings')}>
                View Settings
              </Button>
            </Card>
            
            <Card title="History" hoverable>
              <Text>Review your previous conversations and interactions.</Text>
              <br />
              <Button style={{ marginTop: '16px' }}>
                View History
              </Button>
            </Card>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default Dashboard;