import React from 'react';
import { Typography, Space, Button, Tag } from 'antd';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface SelectedTextPreviewProps {
  selectedText: string;
  onClear: () => void;
  onSend: () => void;
}

/**
 * Component hiển thị preview của text được bôi đen
 * Xuất hiện trên khung chat input, tương tự các hệ thống AI lớn
 */
const SelectedTextPreview: React.FC<SelectedTextPreviewProps> = ({
  selectedText,
  onClear,
  onSend,
}) => {
  if (!selectedText) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        border: '1px solid #0ea5e9',
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 12,
        boxShadow: '0 2px 8px rgba(14, 165, 233, 0.1)',
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {/* Header with tag and close button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tag color="blue" style={{ margin: 0, fontSize: 12, fontWeight: 500 }}>
            📝 Selected Text - Follow Up
          </Tag>
          <Button
            type="text"
            icon={<CloseOutlined />}
            size="small"
            onClick={onClear}
            style={{
              color: '#64748b',
              padding: '4px',
              height: 24,
              width: 24,
            }}
          />
        </div>

        {/* Selected text content with max height */}
        <div
          style={{
            background: 'white',
            borderRadius: 8,
            padding: '10px 12px',
            maxHeight: 120,
            overflowY: 'auto',
            border: '1px solid #e0f2fe',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: '#334155',
              lineHeight: 1.6,
              wordBreak: 'break-word',
            }}
          >
            {selectedText}
          </Text>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            size="small"
            onClick={onClear}
            style={{ borderRadius: 6 }}
          >
            Clear
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={onSend}
            style={{
              borderRadius: 6,
              background: '#0ea5e9',
              borderColor: '#0ea5e9',
            }}
          >
            Ask AI
          </Button>
        </div>
      </Space>

      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default SelectedTextPreview;
