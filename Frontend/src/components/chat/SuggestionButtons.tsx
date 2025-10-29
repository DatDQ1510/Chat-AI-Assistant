import React from 'react';
import { Button, Space } from 'antd';
import { BulbOutlined } from '@ant-design/icons';

interface SuggestionButtonsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isLoading?: boolean;
}

/**
 * Component hiển thị các gợi ý follow-up từ AI
 * Render dưới dạng các button clickable với style đẹp mắt
 */
const SuggestionButtons: React.FC<SuggestionButtonsProps> = ({ 
  suggestions, 
  onSuggestionClick,
  isLoading = false 
}) => {
  // Không render nếu không có suggestions
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        borderRadius: 12,
        border: '1px solid #bae6fd',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <BulbOutlined style={{ color: '#0284c7', fontSize: 16 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: '#0369a1' }}>
          Suggested follow-ups:
        </span>
      </div>

      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            type="text"
            disabled={isLoading}
            onClick={() => onSuggestionClick(suggestion)}
            style={{
              width: '100%',
              height: 'auto',
              padding: '10px 14px',
              textAlign: 'left',
              background: 'white',
              border: '1px solid #e0f2fe',
              borderRadius: 8,
              color: '#0369a1',
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: 'normal',
              transition: 'all 0.2s ease',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#f0f9ff';
                e.currentTarget.style.borderColor = '#0284c7';
                e.currentTarget.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e0f2fe';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <span style={{ marginRight: 8 }}>•</span>
            {suggestion}
          </Button>
        ))}
      </Space>

      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
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

export default SuggestionButtons;
    