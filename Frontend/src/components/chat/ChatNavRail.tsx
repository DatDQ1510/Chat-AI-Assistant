import React, { useMemo, useState } from 'react';
import { Layout, Button, Tooltip, Avatar } from 'antd';
import {
  MessageOutlined,
  CompassOutlined,
  UserOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  MoonOutlined,
  SunOutlined,
  LogoutOutlined,
  PlusOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Sider } = Layout;

interface ChatNavRailProps {
  onNewConversation: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
}

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  action: () => void;
  active?: boolean;
}

const ChatNavRail: React.FC<ChatNavRailProps> = ({
  onNewConversation,
  onToggleTheme,
  onLogout,
  isDarkMode,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const styles = useMemo(() => {
    const neutralBorder = isDarkMode ? 'rgba(148, 163, 184, 0.28)' : '#eef2ff';
    const iconColor = isDarkMode ? '#cbd5f5' : '#4b5563';
    const activeColor = isDarkMode ? '#36cfc9' : '#1677ff';

    return {
      sider: {
        position: 'fixed' as const,
        left: 0,
        top: 0,
        bottom: 0,
        width: 88,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 12px',
        gap: 16,
        background: isDarkMode ? '#0f172a' : '#ffffff',
        borderRight: `1px solid ${neutralBorder}`,
        transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.25s ease',
        zIndex: 1000,
      } as React.CSSProperties,
      overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        opacity: collapsed ? 0 : 1,
        pointerEvents: collapsed ? 'none' : 'auto',
        transition: 'opacity 0.25s ease',
        zIndex: 999,
      } as React.CSSProperties,
      menuButton: {
        position: 'fixed' as const,
        top: 16,
        left: 16,
        zIndex: 1100,
        color: isDarkMode ? '#f1f5f9' : '#334155',
      } as React.CSSProperties,
      group: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      } as React.CSSProperties,
      sections: {
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      } as React.CSSProperties,
      circleButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        color: iconColor,
        border: 'none',
        boxShadow: 'none',
      } as React.CSSProperties,
      circleButtonActive: {
        background: `${activeColor}1a`,
        color: activeColor,
      } as React.CSSProperties,
      newChatButton: {
        width: 52,
        height: 52,
        borderRadius: 18,
      } as React.CSSProperties,
      bottom: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        alignItems: 'center',
      } as React.CSSProperties,
      avatar: {
        background: isDarkMode ? '#1f2937' : '#f1f5f9',
      } as React.CSSProperties,
    };
  }, [isDarkMode, collapsed]);

  const primaryItems: NavItem[] = [
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: 'Chat',
      action: () => navigate('/chat'),
      active: location.pathname.startsWith('/chat'),
    },
    {
      key: 'explore',
      icon: <CompassOutlined />,
      label: 'Explore',
      action: () => window.open('https://openai.com/chatgpt', '_blank', 'noopener,noreferrer'),
    },
    {
      key: 'lightning',
      icon: <ThunderboltOutlined />,
      label: 'New features',
      action: () => window.open('https://platform.openai.com/docs/overview', '_blank'),
    },
  ];

  const secondaryItems: NavItem[] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      action: () => navigate('/dashboard'),
      active: location.pathname.startsWith('/dashboard'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      action: () => navigate('/settings'),
      active: location.pathname.startsWith('/settings'),
    },
  ];

  const renderButton = (item: NavItem) => (
    <Tooltip title={item.label} placement="right" key={item.key}>
      <Button
        type="text"
        shape="circle"
        icon={item.icon}
        onClick={item.action}
        style={{
          ...styles.circleButton,
          ...(item.active ? styles.circleButtonActive : {}),
        }}
      />
    </Tooltip>
  );

  return (
    <>
      {/* Nút menu toggle */}
      <Button
        type="text"
        icon={<MenuOutlined />}
        onClick={() => setCollapsed((prev) => !prev)}
        style={styles.menuButton}
      />

      {/* Overlay */}
      <div style={styles.overlay} onClick={() => setCollapsed(true)} />

      {/* Sidebar chính */}
      <Sider width={88} theme={isDarkMode ? 'dark' : 'light'} style={styles.sider}>
        <div style={styles.group}>
          <Tooltip title="New chat" placement="right">
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<PlusOutlined />}
              onClick={onNewConversation}
              style={styles.newChatButton}
            />
          </Tooltip>

          <div style={styles.sections}>
            <div style={styles.group}>{primaryItems.map(renderButton)}</div>
            <div style={styles.group}>{secondaryItems.map(renderButton)}</div>
          </div>
        </div>

        <div style={styles.bottom}>
          <Tooltip
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            placement="right"
          >
            <Button
              type="text"
              shape="circle"
              icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
              onClick={onToggleTheme}
              style={styles.circleButton}
            />
          </Tooltip>

          <Tooltip title="Sign out" placement="right">
            <Button
              type="text"
              shape="circle"
              icon={<LogoutOutlined />}
              onClick={onLogout}
              style={styles.circleButton}
            />
          </Tooltip>

          <Tooltip title="Your workspace" placement="right">
            <Avatar icon={<UserOutlined />} size="small" style={styles.avatar} />
          </Tooltip>
        </div>
      </Sider>
    </>
  );
};

export default ChatNavRail;
