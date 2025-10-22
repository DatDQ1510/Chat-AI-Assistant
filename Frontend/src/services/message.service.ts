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
	important?: boolean; // ✅ Add important field
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

const mapMessage = (dto: MessageDto): Message => {
	console.log('📦 Mapping message DTO:', dto);
	return {
		id: dto.id, // Already a string (UUID)
		role: dto.sender_type === 'user' ? 'user' : 'assistant',
		content: dto.content,
		timestamp: new Date(dto.created_at || dto.createdAt || dto.updated_at || dto.updatedAt || new Date()), // ✅ Use created_at for sorting
		important: dto.important || false, // ✅ Map important field
	};
};

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

/**
 * Semantic search for messages
 * @param query - Search query
 * @param options - Search options
 */
interface SearchResultDto {
	id: string;
	content: string;
	conversation_id: string;
	distance?: number; // Distance from query (lower = more relevant)
	sender_type?: 'user' | 'chatbot';
	created_at?: string;
	updated_at?: string;
	important?: boolean;
}

interface SearchResultFrontend {
	id: string;
	content: string;
	conversation_id: string;
	conversation_title?: string;
	relevance_score?: number;
	role: 'user' | 'assistant';
	timestamp: Date;
	important?: boolean;
}

const semanticSearch = async (
	query: string,
	limit = 5,
) => {
	try {
		const response = await axiosClient.post<ApiResponse<SearchResultDto[]>>(
			'v1/api/messages/search',
			{
				query,
				limit,
			}
		);
		
		console.log("Semantic search response:", response.data);
		
		// Backend returns: { success, message, data: [...] }
		const rawResults = response.data.data || [];
		
		// Map to frontend format
		const results: SearchResultFrontend[] = rawResults.map(result => ({
			id: result.id,
			content: result.content,
			conversation_id: result.conversation_id,
			conversation_title: undefined, // TODO: Get from conversations
			relevance_score: result.distance ? (1 - Math.min(result.distance / 2, 1)) : undefined, // Convert distance to 0-1 score
			role: result.sender_type === 'user' ? 'user' : 'assistant',
			timestamp: new Date(result.created_at || result.updated_at || new Date()),
			important: result.important || false,
		}));
		
		return { results };
	} catch (error) {
		console.error('Semantic search error:', error);
		return { results: [] };
	}
};

/**
 * Toggle important status for a message
 * @param messageId - Message ID
 * @param important - Important status
 */
const toggleImportant = async (messageId: string, important: boolean) => {
	try {
		const response = await axiosClient.patch<ApiResponse<MessageDto>>(
			`v1/api/messages/${messageId}/important`,
			{ important }
		);
		return { success: true, data: response.data.data };
	} catch (error) {
		console.error('Toggle important error:', error);
		return { success: false, error };
	}
};

export default {
	getMessagesByConversation,
	createMessage,
	getAIReply,
	semanticSearch,
	toggleImportant,
};
