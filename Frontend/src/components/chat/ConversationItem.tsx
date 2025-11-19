import React, { useMemo, useState } from 'react';
import { Button, Typography, Dropdown, Modal, Input, Tooltip, Tag } from 'antd';
import { 
  EllipsisOutlined, 
  DeleteOutlined, 
  EditOutlined,
  MessageOutlined,
  TagOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { ConversationItemProps } from '../../types/chat';
import AddTagModal from './AddTagModal';

const { Text } = Typography;

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
  onDelete,
  onRename,
  onUpdateTag,
  isCompact = false,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);

  const styles = useMemo(() => {
    const activeAccent = '#1677ff';

    return {
      container: {
        display: 'flex',
        alignItems: 'center',
        gap: 10, // ✅ Reduced from 15
        padding: isCompact ? 6 : '8px 10px', // ✅ Reduced padding
        borderRadius: isCompact ? 8 : 10, // ✅ Reduced from 10/14
        cursor: 'pointer',
        border: `1px solid ${isActive ? `${activeAccent}33` : 'transparent'}`,
        backgroundColor: isActive ? `${activeAccent}10` : 'transparent',
        transition: 'all 0.2s ease',
        justifyContent: isCompact ? 'center' : 'space-between',
        width: isCompact ? 48 : '100%',
      } as React.CSSProperties,
      content: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: isCompact ? 'center' : 'flex-start',
        gap: isCompact ? 0 : 10, // ✅ Reduced from 12
        flex: isCompact ? '0 0 auto' : 1,
        width: isCompact ? '100%' : 'auto',
      } as React.CSSProperties,
      icon: {
        fontSize: isCompact ? 20 : 16, // ✅ Reduced from 22/10
        color: isActive ? activeAccent : '#94a3b8',
        marginTop: isCompact ? 0 : 2,
      } as React.CSSProperties,
      info: {
        flex: 1,
        flexDirection: 'column',
        gap: 2,
        minWidth: 0,
        display: isCompact ? 'none' : 'flex',
      } as React.CSSProperties,
      title: {
        fontWeight: 600,
        fontSize: 16,
        color: '#1f2937',
        maxWidth: '180px', // ✅ Limit width to prevent overflow
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      } as React.CSSProperties,
      date: {
        fontSize: 12, // ✅ Reduced from 16
        color: '#64748b',
      } as React.CSSProperties,
      menuButton: {
        fontSize: 16, // ✅ Reduced from 20
        borderRadius: 8, // ✅ Reduced from 10
        color: '#82abe3ff',
        display: isCompact ? 'none' : 'inline-flex',
      } as React.CSSProperties,
      renameInput: {
        borderRadius: 10,
      } as React.CSSProperties,
    };
  }, [isActive, isCompact]);

  const handleRename = () => {
    if (newTitle.trim() && newTitle !== conversation.title) {
      onRename?.(conversation.id, newTitle.trim());
    }
    setIsRenaming(false);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete conversation',
      content: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => onDelete?.(conversation.id),
    });
  };

  const handleUpdateTag = async (tag: string | null) => {
    if (onUpdateTag) {
      await onUpdateTag(conversation.id, tag);
      setIsTagModalVisible(false);
    }
  };

  // ✅ Tag color mapping
  const getTagColor = (tag: string) => {
    const colorMap: Record<string, string> = {
      work: 'blue',
      study: 'green',
      fun: 'orange',
      personal: 'purple',
      urgent: 'red',
      ideas: 'cyan',
    };
    return colorMap[tag.toLowerCase()] || 'default';
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'rename',
      label: 'Rename',
      icon: <EditOutlined />,
      style: {
        cursor: 'pointer',
        fontSize: 16,
      },
      onClick: (e) => {
        e?.domEvent?.stopPropagation(); // ✅ Stop event propagation
        setIsRenaming(true);
      },
    },
    {
      key: 'tag',
      label: conversation.conversation_tag ? 'Update Tag' : 'Add Tag',
      icon: <TagOutlined />,
      style: {
        cursor: 'pointer',
        fontSize: 16,
      },
      onClick: (e) => {
        e?.domEvent?.stopPropagation(); // ✅ Stop event propagation
        setIsTagModalVisible(true);
      },
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      style: {
        cursor: 'pointer',
        fontSize: 16,
      },
      onClick: (e) => {
        e?.domEvent?.stopPropagation(); // ✅ Stop event propagation
        handleDelete();
      },
    },
  ];

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  const itemContent = (
    <div style={styles.container}>
      <div
        style={styles.content}
        onClick={() => onClick(conversation.id)}
      > 
        <MessageOutlined style={styles.icon} />

        <div style={styles.info}>
          {isRenaming ? (
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onPressEnter={handleRename}
              onBlur={handleRename}
              style={styles.renameInput}
              autoFocus
              size="small"
            />
          ) : (
            <>
              <Text style={styles.title} ellipsis={{ tooltip: conversation.title }}>
                {conversation.title}
              </Text>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 30,
                justifyContent: 'space-between',
               }}>
                <Text style={styles.date}>
                  {formatDate(conversation.updatedAt)}
                </Text>
                {conversation.conversation_tag && (
                  <Tag 
                    color={getTagColor(conversation.conversation_tag)} 
                    style={{ 
                      fontSize: 13, 
                      padding: '0 8px',
                      lineHeight: '20px',
                      margin: 0,
                    }}
                  >
                    {conversation.conversation_tag}
                  </Tag>
                ) }
              </div>
            </>
          )}
        </div>
      </div>

      {!isRenaming && !isCompact && (
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
          arrow
          overlayStyle={{ zIndex: 1050 }} // ✅ Ensure dropdown appears above other elements
        >
          <Button
            type="text"
            size="small"
            icon={<EllipsisOutlined />}
            style={styles.menuButton}
            onClick={(e) => {
              e.stopPropagation(); // ✅ Prevent triggering conversation click
            }}
          />
        </Dropdown>
      )}

      {/* ✅ AddTagModal */}
      <AddTagModal
        visible={isTagModalVisible}
        currentTag={conversation.conversation_tag}
        onConfirm={handleUpdateTag}
        onCancel={() => setIsTagModalVisible(false)}
      />
    </div>
  );

  if (isCompact) {
    return (
      <Tooltip title={conversation.title} placement="right">
        {itemContent}
      </Tooltip>
    );
  }

  return itemContent;
};

export default ConversationItem;