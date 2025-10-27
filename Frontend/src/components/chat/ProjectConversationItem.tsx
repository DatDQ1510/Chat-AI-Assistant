import { useState, type FC } from 'react';
import { Dropdown, Modal, message } from 'antd';
import { MoreOutlined, DeleteOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { Conversation } from '../../types/chat';
import conversationService from '../../services/conversation.service';

interface ProjectConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: (id: string) => void;
  onRemoved: () => void; // Callback after removing from project
}

const ProjectConversationItem: FC<ProjectConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
  onRemoved,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveFromProject = async () => {
    Modal.confirm({
      title: 'Remove from Project',
      content: `Are you sure you want to remove "${conversation.title}" from this project? The conversation will be moved back to the main list.`,
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setIsRemoving(true);
          // Set project_id to null to remove from project
          await conversationService.updateConversationProject(conversation.id, null);
          message.success('Removed from project');
          // Notify parent to refresh
          onRemoved();
        } catch (error) {
          console.error('Failed to remove from project:', error);
          message.error('Failed to remove from project');
        } finally {
          setIsRemoving(false);
        }
      },
    });
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'remove',
      label: 'Remove from Project',
      icon: <DeleteOutlined />,
      onClick: handleRemoveFromProject,
      disabled: isRemoving,
    },
  ];

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent conversation click
  };

  return (
    <div
      onClick={() => onClick(conversation.id)}
      style={{
        padding: '8px 12px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#f0f0f0' : 'transparent',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '14px',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#fafafa';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginRight: '8px',
        }}
      >
        {conversation.title}
      </div>

      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
      >
        <div
          onClick={handleMenuClick}
          style={{
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            opacity: isMenuOpen ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            if (!isMenuOpen) {
              e.currentTarget.style.opacity = '0';
            }
          }}
        >
          <MoreOutlined style={{ fontSize: '16px' }} />
        </div>
      </Dropdown>
    </div>
  );
};

export default ProjectConversationItem;
