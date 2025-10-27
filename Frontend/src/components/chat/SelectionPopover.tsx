import React, { useEffect, useState, useRef } from 'react';
import { Button, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

interface SelectionPopoverProps {
  onAskAI: (selectedText: string) => void;
}

const SelectionPopover: React.FC<SelectionPopoverProps> = ({ onAskAI }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect) {
          // Position popover above selection (50px trên text được bôi đậm)
          setPosition({
            top: rect.top + window.scrollY - 50,
            left: rect.left + window.scrollX + rect.width / 2 - 60, // Căn giữa button
          });
          setSelectedText(text);
          setVisible(true);
        }
      } else {
        setVisible(false);
        setSelectedText('');
      }
    };

    // Lắng nghe sự kiện bôi đen text (desktop + mobile)
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);

    // Ẩn popover khi click bên ngoài
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        const selection = window.getSelection();
        if (!selection?.toString().trim()) {
          setVisible(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAskAI = () => {
    if (selectedText) {
      // Gọi callback với text đã chọn
      onAskAI(selectedText);
      
      // Ẩn popover và xóa selection
      setVisible(false);
      setSelectedText('');
      window.getSelection()?.removeAllRanges();
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1000,
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #e5e7eb',
        animation: 'fadeIn 0.2s ease-in-out',
      }}
    >
      <Tooltip title={`Ask AI about: "${selectedText.substring(0, 40)}${selectedText.length > 40 ? '...' : ''}"`}>
        <Button
          type="primary"
          icon={<QuestionCircleOutlined />}
          onClick={handleAskAI}
          size="small"
          style={{
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Ask AI
        </Button>
      </Tooltip>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-5px);
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

export default SelectionPopover;
