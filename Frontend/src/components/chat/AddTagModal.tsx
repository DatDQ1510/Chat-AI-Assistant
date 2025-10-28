import { useState, useEffect, type FC } from 'react';
import { Modal, Input, Tag, Space, message as antMessage } from 'antd';
import { TagOutlined } from '@ant-design/icons';

interface AddTagModalProps {
  visible: boolean;
  currentTag?: string | null;
  onConfirm: (tag: string | null) => Promise<void>;
  onCancel: () => void;
}

// ✅ Predefined tags with colors
const PREDEFINED_TAGS = [
  { name: 'work', color: 'blue' },
  { name: 'study', color: 'green' },
  { name: 'fun', color: 'orange' },
  { name: 'personal', color: 'purple' },
  { name: 'urgent', color: 'red' },
  { name: 'ideas', color: 'cyan' },
];

const AddTagModal: FC<AddTagModalProps> = ({
  visible,
  currentTag,
  onConfirm,
  onCancel,
}) => {
  const [inputValue, setInputValue] = useState(currentTag || '');
  const [selectedTag, setSelectedTag] = useState(currentTag || '');
  const [loading, setLoading] = useState(false);

  // ✅ Sync state with currentTag when modal opens
  useEffect(() => {
    if (visible) {
      setInputValue(currentTag || '');
      setSelectedTag(currentTag || '');
    }
  }, [visible, currentTag]);

  const handleConfirm = async () => {
    const finalTag = inputValue.trim() || selectedTag;
    
    if (!finalTag) {
      antMessage.warning('Please enter or select a tag');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(finalTag);
      setInputValue('');
      setSelectedTag('');
    } catch (error) {
      console.error('Failed to update tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setInputValue(currentTag || '');
    setSelectedTag(currentTag || '');
    onCancel();
  };

  const handleRemoveTag = async () => {
    setLoading(true);
    try {
      await onConfirm(null);
      setInputValue('');
      setSelectedTag('');
    } catch (error) {
      console.error('Failed to remove tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tagName: string) => {
    setSelectedTag(tagName);
    setInputValue(tagName);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TagOutlined />
          <span>{currentTag ? 'Update Tag' : 'Add Tag'}</span>
        </div>
      }
      open={visible}
      onOk={handleConfirm}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Confirm"
      cancelText="Cancel"
      width={480}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
        {/* Custom Input */}
        <div>
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
            Enter custom tag:
          </div>
          <Input
            placeholder="Type your tag name..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setSelectedTag(e.target.value);
            }}
            prefix={<TagOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            maxLength={20}
          />
        </div>

        {/* Quick Select Tags */}
        <div>
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
            Or select a quick tag:
          </div>
          <Space wrap size={[8, 8]}>
            {PREDEFINED_TAGS.map((tag) => (
              <Tag
                key={tag.name}
                color={selectedTag === tag.name ? tag.color : 'default'}
                style={{
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: '4px 12px',
                  border: selectedTag === tag.name ? `2px solid ${tag.color}` : '1px solid #d9d9d9',
                  fontWeight: selectedTag === tag.name ? 500 : 400,
                }}
                onClick={() => handleTagClick(tag.name)}
              >
                {tag.name}
              </Tag>
            ))}
          </Space>
        </div>

        {/* Current Tag Info */}
        {currentTag && (
          <div style={{ 
            padding: '12px', 
            background: '#f5f5f5', 
            borderRadius: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>Current tag: </span>
              <Tag color={PREDEFINED_TAGS.find(t => t.name === currentTag)?.color || 'default'}>
                {currentTag}
              </Tag>
            </div>
            <a onClick={handleRemoveTag} style={{ fontSize: 12, color: '#ff4d4f' }}>
              Remove tag
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddTagModal;
