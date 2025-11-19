import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import type { SignInFormData } from '../../types/auth';
import './SignIn.css';
import { login as loginService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

const SignIn: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  
  const handleSubmit = async (values: SignInFormData) => {
    setLoading(true);
    try {
      const response = await loginService({
        email: values.email,
        password: values.password,
      });

      if (!response.success || !response.data?.accessToken || !response.data?.sessionId) {
        throw new Error(response.message || 'Missing access token in response');
      }

      login(
        response.data.accessToken,
        response.data.sessionId,
      );

      navigate('/dashboard');
      message.success('Welcome back! Signed in successfully.', 5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {

      message.error(
        error.response?.data?.message || 'Invalid email or password.', 3
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google') => {
    message.info(`${provider} login will be implemented soon!`, 3);

  };  

  const styles = {
    form: {
      width: '100%',
      display: 'grid',
      gap: 16,
    } as React.CSSProperties,
    metaRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      fontSize: 14,
    } as React.CSSProperties,
    subtleLink: {
      color: '#1677ff',
      fontWeight: 500,
    } as React.CSSProperties,
    submitButton: {
      height: 48,
      borderRadius: 12,
      fontWeight: 600,
    } as React.CSSProperties,
    socialButton: {
      height: 48,
      borderRadius: 12,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    } as React.CSSProperties,
    switchRow: {
      textAlign: 'center',
      marginTop: 8,
      fontSize: 14,
    } as React.CSSProperties,
    accentLink: {
      color: '#1677ff',
      fontWeight: 600,
    } as React.CSSProperties,
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account"
    >
      <Form
        form={form}
        name="signin"
        onFinish={handleSubmit}
        initialValues={{ remember: true }}
        layout="vertical"
        requiredMark={false}
        size="large"
        style={styles.form}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please enter your password!' },
            { min: 6, message: 'Password must be at least 6 characters!' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </Form.Item>

        <div style={styles.metaRow}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
          <Link to="/forgot-password" style={styles.subtleLink}>
            Forgot password?
          </Link>
        </div>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            block
            style={styles.submitButton}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Form.Item>

        <Divider plain>
          <span>Or continue with</span>
        </Divider>

        <Button
          icon={<GoogleOutlined />}
          onClick={() => handleSocialLogin('google')}
          block
          style={styles.socialButton}
        >
          Continue with Google
        </Button>

        <div style={styles.switchRow}>
          <span>Don't have an account? </span>
          <Link to="/signup" style={styles.accentLink}>
            Sign up here
          </Link>
        </div>
      </Form>
    </AuthLayout>
  );
};

export default SignIn;