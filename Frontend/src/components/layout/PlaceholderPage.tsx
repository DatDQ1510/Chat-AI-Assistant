import React from 'react';
import { Card, Typography, Space, Button } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

type PlaceholderButtonType = 'primary' | 'default' | 'dashed' | 'link';

export interface PlaceholderAction {
  key?: React.Key;
  label: React.ReactNode;
  to?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  type?: PlaceholderButtonType;
  ghost?: boolean;
  danger?: boolean;
}

interface PlaceholderPageProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  spotlight?: React.ReactNode;
  hint?: React.ReactNode;
  actions?: PlaceholderAction[];
  children?: React.ReactNode;
}

const renderActionButton = (action: PlaceholderAction) => {
  const button = (
    <Button
      size="large"
      type={action.type ?? 'primary'}
      icon={action.icon}
      ghost={action.ghost}
      danger={action.danger}
      onClick={action.onClick}
    >
      {action.label}
    </Button>
  );

  if (action.to) {
    return (
      <Link key={action.key ?? action.to} to={action.to} className="placeholder-link-wrapper">
        {button}
      </Link>
    );
  }

  return React.cloneElement(button, { key: action.key ?? String(action.label) });
};

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  spotlight,
  hint,
  actions = [],
  children,
}) => {
  return (
    <div className="placeholder-shell">
      <div className="placeholder-blur" />
      <Card bordered={false} className="placeholder-card">
        {spotlight && <div className="placeholder-spotlight">{spotlight}</div>}
        <Space direction="vertical" size={20} align="center" style={{ width: '100%' }}>
          <Title level={2} className="placeholder-title">
            {title}
          </Title>
          {description && (
            <Paragraph className="placeholder-description">
              {description}
            </Paragraph>
          )}
          {hint && (
            <Text className="placeholder-hint">{hint}</Text>
          )}
          {children && (
            <div className="placeholder-extra">{children}</div>
          )}
          {actions.length > 0 && (
            <Space size="middle" wrap className="placeholder-actions">
              {actions.map((action) => renderActionButton(action))}
            </Space>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
