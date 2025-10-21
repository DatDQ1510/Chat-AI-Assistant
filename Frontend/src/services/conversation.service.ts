import axiosClient from '../config/axiosClient';
import type { Conversation } from '../types/chat';

type ApiResponse<T> = {
	success: boolean;
	message: string;
	data: T;
};

type ConversationDto = {
	id: number;
	conversation_name: string;
	user_id?: number;
	createdAt?: string;
	updatedAt?: string;
};

type PaginatedConversationsDto = {
	conversations: ConversationDto[];
	pagination: {
		total: number;
		page: number;
		totalPages: number;
		limit?: number;
	};
};

const mapConversation = (dto: ConversationDto): Conversation => ({
	id: String(dto.id),
	title: dto.conversation_name ?? 'New chat',
	user_id: dto.user_id ?? 0,
	createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
	updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
});

interface PaginationParams {
	page?: number;
	limit?: number;
	signal?: AbortSignal;
}

const getUserConversations = async ({
	page = 1,
	limit = 20,
	signal,
}: PaginationParams = {}) => {
	const response = await axiosClient.get<ApiResponse<PaginatedConversationsDto>>(
		'v1/api/conversations',
		{
			params: { page, limit },
			signal,
		}
	);

	const { conversations, pagination } = response.data.data;

	return {
		conversations: conversations.map(mapConversation),
		pagination, 	
	};
};

const getConversation = async (id: string | number) => {
	const response = await axiosClient.get<ApiResponse<ConversationDto>>(
		`v1/api/conversations/${id}`
	);

	return mapConversation(response.data.data);
};

const createConversation = async (conversationName?: string) => {
	const response = await axiosClient.post<ApiResponse<ConversationDto>>(
		'v1/api/conversations',
		{ conversation_name: conversationName }
	);

	return mapConversation(response.data.data);
};

const renameConversation = async (
	id: string | number,
	conversationName: string
) => {
	await axiosClient.patch<ApiResponse<null>>(
		`v1/api/conversations/${id}`,
		{ conversation_name: conversationName }
	);
};

const deleteConversation = async (id: string | number) => {
	await axiosClient.delete<ApiResponse<null>>(`v1/api/conversations/${id}`);
};

export default {
	getUserConversations,
	getConversation,
	createConversation,
	renameConversation,
	deleteConversation,
};
