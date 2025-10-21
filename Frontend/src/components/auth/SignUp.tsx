import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Divider, Progress } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import type { SignUpFormData } from '../../types/auth';
import { register as registerService } from '../../services/auth.service';

const SignUp: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength += 20;
    if (password.length >= 10) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 40) return '#ff4d4f';
    if (strength < 70) return '#faad14';
    return '#52c41a';
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const handleSubmit = async (values: SignUpFormData) => {
    setLoading(true);
    try {
      const response = await registerService(values);

      if (!response.success) {
        throw new Error(response.message || 'Failed to create account');
      }

      message.success(response.message || 'Account created successfully! Please sign in.');
      navigate("/signin");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Signup failed:", error);
      message.error(error.response?.data?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };


  const handleSocialSignUp = (provider: 'google') => {
    message.info(`${provider} sign up will be implemented soon!`);
    alert('Social sign up is not implemented yet.');
  };

  const styles = {
    form: {
      width: '100%',
      display: 'grid',
      gap: 16,
    } as React.CSSProperties,
    nameRow: {
      display: 'grid',
      gap: 16,
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    } as React.CSSProperties,
    strengthContainer: {
      display: 'grid',
      gap: 8,
      marginTop: -8,
    } as React.CSSProperties,
    strengthMeta: {
      fontSize: 13,
      fontWeight: 500,
    } as React.CSSProperties,
    agreementLink: {
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
      title="Create Account"
      subtitle="Join us today and get started"
    >
      <Form
        form={form}
        name="signup"
        onFinish={handleSubmit}
        layout="vertical"
        requiredMark={false}
        size="large"
        style={styles.form}
      >
        <div style={styles.nameRow}>
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              { required: true, message: 'Please enter your first name!' },
              { min: 2, message: 'First name must be at least 2 characters!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="First Name"
              autoComplete="given-name"
            />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[
              { required: true, message: 'Please enter your last name!' },
              { min: 2, message: 'Last name must be at least 2 characters!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Last Name"
              autoComplete="family-name"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
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
            placeholder="Create a password"
            autoComplete="new-password"
            onChange={handlePasswordChange}
          />
        </Form.Item>

        {passwordStrength > 0 && (
          <div style={styles.strengthContainer}>
            <Progress
              percent={passwordStrength}
              strokeColor={getPasswordStrengthColor(passwordStrength)}
              showInfo={false}
              size="small"
            />
            <div style={{ ...styles.strengthMeta, color: getPasswordStrengthColor(passwordStrength) }}>
              Password Strength: {getPasswordStrengthText(passwordStrength)}
            </div>
          </div>
        )}

        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject(new Error('Please accept the terms!')),
            },
          ]}
        >
          <Checkbox>
            I agree to the{' '}
            <Link to="/terms" style={styles.agreementLink}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" style={styles.agreementLink}>
              Privacy Policy
            </Link>
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            block
            style={styles.submitButton}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </Form.Item>

        <Divider plain>
          <span>Or sign up with</span>
        </Divider>

        <Button
          icon={<GoogleOutlined />}
          onClick={() => handleSocialSignUp('google')}
          block
          style={styles.socialButton}
        >
          Sign up with Google
        </Button>

        <div style={styles.switchRow}>
          <span>Already have an account? </span>
          <Link to="/signin" style={styles.accentLink}>
            Sign in here
          </Link>
        </div>
      </Form>
    </AuthLayout>
  );
};

export default SignUp;