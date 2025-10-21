import React, { useMemo, useState } from 'react';
import { Button, Typography, Dropdown, Modal, Input, Tooltip } from 'antd';
import { 
  EllipsisOutlined, 
  DeleteOutlined, 
  EditOutlined,
  MessageOutlined 
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { ConversationItemProps } from '../../types/chat';

const { Text } = Typography;

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
  onDelete,
  onRename,
  isCompact = false,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title);

  const styles = useMemo(() => {
    const activeAccent = '#1677ff';

    return {
      container: {
        display: 'flex',
        alignItems: 'center',
        gap: 15,
        padding: isCompact ? 8 : '12px 14px',
        borderRadius: isCompact ? 10 : 14,
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
        gap: isCompact ? 0 : 12,
        flex: isCompact ? '0 0 auto' : 1,
        width: isCompact ? '100%' : 'auto',
      } as React.CSSProperties,
      icon: {
        fontSize: isCompact ? 22 : 10,
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
        fontWeight: 750,
        fontSize: 18,
        color: '#1f2937',
      } as React.CSSProperties,
      date: {
        fontSize: 16,
        color: '#64748b',
      } as React.CSSProperties,
      menuButton: {
        fontSize: 20,
        borderRadius: 10,
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

  const menuItems: MenuProps['items'] = [
    {
      key: 'rename',
      label: 'Rename',
      icon: <EditOutlined />,
      style: {
        cursor: 'pointer',
        fontSize: 16,
      },
      onClick: () => setIsRenaming(true),
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
      onClick: handleDelete,
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
              <Text style={styles.date}>
                {formatDate(conversation.updatedAt)}
              </Text>
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
        >
          <Button
            type="text"
            size="small"
            icon={<EllipsisOutlined />}
            style={styles.menuButton}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      )}
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