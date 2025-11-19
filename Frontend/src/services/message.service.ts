import axiosClient from '../config/axiosClient';
import type { Files, Message } from '../types/chat';

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
	createdAt?: string;
	updatedAt?: string;
	important?: boolean; // ✅ Add important field
	file_urls?: Files[]; // ✅ Attached file URLs
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

	return {
		id: dto.id, // Already a string (UUID)
		role: dto.sender_type === 'user' ? 'user' : 'assistant',
		content: dto.content,
		timestamp: new Date(dto.createdAt || dto.createdAt || dto.updatedAt || dto.updatedAt || new Date()), // ✅ Use createdAt for sorting
		important: dto.important || false, // ✅ Map important field
		attachments: dto.file_urls && dto.file_urls.length > 0 ? dto.file_urls : undefined, // ✅ Map file URLs
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
    `/v1/api/messages/${conversationId}`,
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
		'/v1/api/messages',
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
		'/v1/api/messages/reply',
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
	relevance_score?: number; // Relevance score from backend (0-1, higher = more relevant)
	sender_type?: 'user' | 'chatbot';
	createdAt?: string;
	updatedAt?: string;
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
	conversationId?: string,
) => {
	try {
		const response = await axiosClient.post<ApiResponse<SearchResultDto[]>>(
			'/v1/api/messages/search',
			{
				query,
				limit,
				conversationId
			}
		);
		

		
		// Backend returns: { success, message, data: [...] }
		const rawResults = response.data.data || [];
		
		// Map to frontend format with relevance_score from backend
		const results: SearchResultFrontend[] = rawResults.map(result => ({
			id: result.id,
			content: result.content,
			conversation_id: result.conversation_id,
			conversation_title: undefined, // TODO: Get from conversations
			relevance_score: result.relevance_score || (result.distance ? (1 - Math.min(result.distance / 2, 1)) : undefined),
			role: result.sender_type === 'user' ? 'user' : 'assistant',
			timestamp: new Date(result.createdAt || result.updatedAt || new Date()),
			important: result.important || false,
		}));
		
		return { results };
	} catch (error) {
		console.error('Semantic search failed:', error);
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
			`/v1/api/messages/${messageId}/important`,
			{ important }
		);
		return { success: true, data: response.data.data };
	} catch (error) {

		return { success: false, error };
	}
};

/**
 * Get all important messages in a conversation
 * @param conversationId - Conversation ID
 */
const getImportantMessages = async (conversationId: string): Promise<Message[]> => {
	try {
		const response = await axiosClient.get<ApiResponse<MessageDto[]>>(
			`/v1/api/messages/important/${conversationId}`
		);
		
		const messages = response.data.data || [];
		return messages.map(mapMessage);
	} catch (error) {
		console.error('Failed to get important messages:', error);
		return [];
	}
};

export default {
	getMessagesByConversation,
	createMessage,
	getAIReply,
	semanticSearch,
	toggleImportant,
	getImportantMessages,
};
