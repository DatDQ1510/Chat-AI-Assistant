import React, { useEffect, useState } from 'react';
import { ArrowLeftOutlined, SettingTwoTone, SaveOutlined } from '@ant-design/icons';
import { Typography, Form, Select, Button, Card, message, Spin, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/user.service';
import type { UserSettings } from '../services/user.service';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const loadSettings = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading user settings...');
      const data = await userService.getSettings();
      console.log('✅ Settings loaded:', data);
      setSettings(data);
      form.setFieldsValue({
        language: data.language || 'en',
        writing_style: data.writing_style || 'friendly',
        custom_instructions: data.custom_instructions || '',
        roleplay_mode: data.roleplay_mode || '',
      });
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      if (error instanceof Error) {
        message.error(`Failed to load settings: ${error.message}`);
      } else {
        message.error('Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (values: { 
    language: string; 
    writing_style: string;
    custom_instructions?: string;
    roleplay_mode?: string;
  }) => {
    try {
      setSaving(true);
      console.log('💾 Saving settings:', values);
      await userService.updateSettings({
        language: values.language,
        writing_style: values.writing_style,
        custom_instructions: values.custom_instructions || '',
        roleplay_mode: values.roleplay_mode || '',
      });
      console.log('✅ Settings saved successfully');
      message.success('Settings saved successfully!');
      setSettings(prev => prev ? { ...prev, ...values } : null);
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      if (error instanceof Error) {
        message.error(`Failed to save settings: ${error.message}`);
      } else {
        message.error('Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/chat')}
          style={{ marginBottom: 24 }}
        >
          Back to Chat
        </Button>

        <Card>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <SettingTwoTone 
              twoToneColor="#0284c7" 
              style={{ fontSize: 48, marginBottom: 16 }}
            />
            <Title level={2}>Settings</Title>
            <Paragraph type="secondary">
              Customize how the AI assistant responds to you
            </Paragraph>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              language: 'en',
              writing_style: 'friendly',
              custom_instructions: '',
              roleplay_mode: ''
            }}
          >
            <Form.Item
              label="Response Language"
              name="language"
              rules={[{ required: true, message: 'Please select a language' }]}
              tooltip="The language AI will use to respond"
            >
              <Select size="large">
                <Option value="en">🇬🇧 English</Option>
                <Option value="vi">🇻🇳 Tiếng Việt</Option>
                <Option value="ja">🇯🇵 日本語 (Japanese)</Option>
                <Option value="zh">🇨🇳 中文 (Chinese)</Option>
                <Option value="es">🇪🇸 Español (Spanish)</Option>
                <Option value="fr">🇫🇷 Français (French)</Option>
                <Option value="de">🇩🇪 Deutsch (German)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Writing Style"
              name="writing_style"
              rules={[{ required: true, message: 'Please select a writing style' }]}
              tooltip="How formal or casual should the AI's responses be"
            >
              <Select size="large">
                <Option value="formal">🎩 Formal - Trang trọng, chuyên nghiệp</Option>
                <Option value="friendly">😊 Friendly - Thân thiện, gần gũi</Option>
                <Option value="casual">💬 Casual - Thoải mái, không gò bó</Option>
                <Option value="technical">🔧 Technical - Chuyên môn, kỹ thuật</Option>
                <Option value="concise">⚡ Concise - Ngắn gọn, súc tích</Option>
                <Option value="detailed">📚 Detailed - Chi tiết, đầy đủ</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Roleplay Mode"
              name="roleplay_mode"
              tooltip="Choose a persona for the AI to adopt"
            >
              <Select size="large" allowClear placeholder="Select a roleplay mode (optional)">
                <Option value="">None - Default AI behavior</Option>
                <Option value="mentor">🧙 Mentor - Wise guide with insightful advice</Option>
                <Option value="tutor">👨‍🏫 Tutor - Patient teacher with step-by-step explanations</Option>
                <Option value="friend">🤝 Friend - Supportive companion with empathy</Option>
                <Option value="professional">💼 Professional - Expert consultant with structured recommendations</Option>
                <Option value="coach">💪 Coach - Motivational guide who inspires action</Option>
                <Option value="expert">🎓 Expert - Domain specialist with deep knowledge</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Custom Instructions"
              name="custom_instructions"
              tooltip="Define specific behaviors or preferences for the AI"
            >
              <TextArea
                rows={4}
                placeholder="E.g., 'Always explain in simple terms', 'Act as a coding mentor', 'Include practical examples', 'Be encouraging and supportive'"
                maxLength={500}
                showCount
                size="large"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={saving}
                size="large"
                block
                style={{ background: '#0284c7', borderColor: '#0284c7' }}
              >
                Save Settings
              </Button>
            </Form.Item>
          </Form>

          {settings && (
            <div style={{ 
              marginTop: 32, 
              padding: 16, 
              background: '#f0f9ff', 
              borderRadius: 8,
              border: '1px solid #bae6fd'
            }}>
              <Paragraph style={{ marginBottom: 8, fontWeight: 500 }}>
                👤 {settings.firstname} {settings.lastname}
              </Paragraph>
              <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 12 }}>
                📧 {settings.email}
              </Paragraph>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
