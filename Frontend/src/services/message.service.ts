import axiosClient from '../config/axiosClient';
import type { Message } from '../types/chat';

type ApiResponse<T> = {
	success: boolean;
	message: string;
	data: T;
};

type MessageDto = {
	id: string;
	conversation_id: string;
	sender_type: 'user' | 'chatbot';
	user_id?: string | null;
	chatbot_id?: string | null;
	content: string;
	created_at?: string;
	updated_at?: string;
	createdAt?: string;
	updatedAt?: string;
};

type PaginatedMessagesDto = {
	messages?: MessageDto[];
	rows?: MessageDto[];
	count?: number;
	pagination?: {
		total: number;
		page: number;
		totalPages: number;
		limit?: number;
	};
};

const mapMessage = (dto: MessageDto): Message => ({
	id: dto.id, // Already a string (UUID)
	role: dto.sender_type === 'user' ? 'user' : 'assistant',
	content: dto.content,
	timestamp: new Date(dto.updated_at || dto.updatedAt || dto.created_at || dto.createdAt || new Date()),
});

interface PaginationParams {
	page?: number;
	limit?: number;
	signal?: AbortSignal;
}

/**
 * Get messages for a conversation
 */
const getMessagesByConversation = async (
  conversationId: string | number,
  { page = 1, limit = 10, signal }: PaginationParams = {}
) => {
  const response = await axiosClient.get<ApiResponse<PaginatedMessagesDto>>(
    `v1/api/messages/${conversationId}`,
    {
      params: { page, limit },
      signal,
    }
  );

  const data = response.data?.data || response.data;

  // ✅ Fix ở đây
  const messageList = Array.isArray(data) ? data : data?.rows || data?.messages || [];

  const total = data?.count || messageList.length;

  const pagination = data?.pagination || {
    total: total,
    page: page,
    totalPages: Math.ceil(total / limit),
    limit: limit,
  };

  return {
    messages: messageList.map(mapMessage),
    pagination,
  };
};

/**
 * Create a user message
 */
const createMessage = async (
	conversationId: string | number,
	content: string
) => {
	const response = await axiosClient.post<ApiResponse<MessageDto>>(
		'v1/api/messages',
		{
			conversation_id: conversationId,
			content,
		}
	);

	return mapMessage(response.data.data);
};

/**
 * Get AI reply for a conversation
 * This would typically call your AI service
 */
const getAIReply = async (
	conversationId: string | number,
	content: string
) => {
	const response = await axiosClient.post<ApiResponse<MessageDto>>(
		'v1/api/messages/reply',
		{
			conversation_id: conversationId,
			content,
		}
	);

	return mapMessage(response.data.data);
};

export default {
	getMessagesByConversation,
	createMessage,
	getAIReply,
};
