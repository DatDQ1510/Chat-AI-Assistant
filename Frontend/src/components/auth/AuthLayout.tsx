import React, { useMemo } from 'react';
import { Layout, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const styles = useMemo(() => ({
    wrapper: {
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px 16px',
      background: '#f5f6fa',
    } as React.CSSProperties,
    content: {
      width: '100%',
      maxWidth: 440,
      display: 'flex',
      justifyContent: 'center',
    } as React.CSSProperties,
    card: {
      width: '100%',
      borderRadius: 20,
      padding: '40px 36px 36px',
      boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
      border: '1px solid rgba(226, 232, 240, 0.7)',
      background: '#ffffff',
    } as React.CSSProperties,
    header: {
      textAlign: 'center',
      marginBottom: 32,
      display: 'grid',
      gap: 16,
    } as React.CSSProperties,
    iconRow: {
      display: 'inline-flex',
      gap: 12,
      justifyContent: 'center',
      fontSize: 40,
      color: '#1677ff',
    } as React.CSSProperties,
    subtitle: {
      color: '#64748b',
      fontSize: 15,
    } as React.CSSProperties,
    formContainer: {
      width: '100%',
    } as React.CSSProperties,
  }), []);

  return (
    <Layout style={styles.wrapper}>
      <Content style={styles.content}>
        <Card style={styles.card} bordered={false}>
          <div style={styles.header}>
            <div style={styles.iconRow}>
              <UserOutlined />
              <LockOutlined />
            </div>
            <Title level={2} style={{ margin: 0 }}>
              {title}
            </Title>
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </div>
          <div style={styles.formContainer}>{children}</div>
        </Card>
      </Content>
    </Layout>
  );
};

export default AuthLayout;