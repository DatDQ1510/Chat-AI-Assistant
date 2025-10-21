import React, { useState } from 'react';
import { ArrowLeftOutlined, MailOutlined, SafetyCertificateTwoTone } from '@ant-design/icons';
import { Button, Divider, Form, Input, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';

const { Paragraph, Text } = Typography;

interface ForgotPasswordForm {
  email: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [form] = Form.useForm<ForgotPasswordForm>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async ({ email }: ForgotPasswordForm) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      message.success(`Reset link sent to ${email}`);
      navigate('/signin');
  } catch {
      message.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="We'll send a secure link to your inbox">
      <div className="forgot-password-hero">
        <div className="placeholder-icon small">
          <SafetyCertificateTwoTone twoToneColor="#10a37f" />
        </div>
        <Paragraph type="secondary" className="forgot-password-subtitle">
          Enter the email linked with your account. If it exists, we'll send a reset email instantly.
        </Paragraph>
      </div>

      <Form<ForgotPasswordForm>
        form={form}
        layout="vertical"
        size="large"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email address' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="you@company.com"
            autoComplete="email"
            allowClear
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="submit-btn"
            block
          >
            {loading ? 'Sending reset link…' : 'Send reset link'}
          </Button>
        </Form.Item>
      </Form>

      <Divider plain>
        <Text type="secondary">Never shared with anyone</Text>
      </Divider>

      <Button
        icon={<ArrowLeftOutlined />}
        size="large"
        block
        onClick={() => navigate(-1)}
      >
        Back to previous page
      </Button>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
