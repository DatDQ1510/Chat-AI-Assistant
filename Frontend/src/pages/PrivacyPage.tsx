import React from 'react';
import { LockTwoTone, ArrowLeftOutlined } from '@ant-design/icons';
import { Typography, Divider } from 'antd';
import PlaceholderPage from '../components/layout/PlaceholderPage';

const { Title, Paragraph } = Typography;

const PrivacyPage: React.FC = () => (
  <PlaceholderPage
    title="Privacy Policy"
    description="Transparency first. We collect only what we need to make your AI assistant smarter and safer."
    spotlight={
      <div className="placeholder-icon">
        <LockTwoTone twoToneColor="#14b8a6" />
      </div>
    }
    actions={[
      {
        to: '/signup',
        label: 'Back to sign up',
        icon: <ArrowLeftOutlined />,
        type: 'default',
        ghost: true,
      },
    ]}
  >
    <div className="policy-content">
      <Title level={4}>Data principles</Title>
      <Paragraph>
        • Conversations are encrypted at rest and in transit.
        <br />
        • We'll never sell your personal information.
        <br />
        • You decide how long transcripts are retained.
      </Paragraph>
      <Divider />
      <Paragraph type="secondary">
        A detailed privacy document is under review. Need something now? Email{' '}
        <a href="mailto:privacy@example.com">privacy@example.com</a> and we'll help right away.
      </Paragraph>
    </div>
  </PlaceholderPage>
);

export default PrivacyPage;
