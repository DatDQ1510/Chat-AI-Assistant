import React from 'react';
import { BookTwoTone, ArrowLeftOutlined } from '@ant-design/icons';
import { Typography, Divider } from 'antd';
import PlaceholderPage from '../components/layout/PlaceholderPage';

const { Title, Paragraph } = Typography;

const TermsPage: React.FC = () => (
  <PlaceholderPage
    title="Terms of Service"
    description="We value clarity. Here's a quick look at how we work together and keep your data safe."
    spotlight={
      <div className="placeholder-icon">
        <BookTwoTone twoToneColor="#6366f1" />
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
      <Title level={4}>In short</Title>
      <Paragraph>
        • You're responsible for keeping your credentials safe.
        <br />
        • We store conversations securely to improve the assistant.
        <br />
        • You can request deletion of your data at any time.
      </Paragraph>
      <Divider />
      <Paragraph type="secondary">
  A full legal version will be published soon. Until then, you're welcome to reach out to{' '}
  <a href="mailto:support@example.com">support@example.com</a> with any compliance questions.
      </Paragraph>
    </div>
  </PlaceholderPage>
);

export default TermsPage;
