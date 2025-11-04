import axiosClient from '../config/axiosClient';
import type { Conversation } from '../types/chat';

type ApiResponse<T> = {
	success: boolean;
	message: string;
	data: T;
};

type ConversationDto = {
	id: string;
	conversation_name: string;
	user_id?: string;
	project_id?: string | null;
	conversation_tag?: string | null;
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
	user_id: dto.user_id ?? '',
	project_id: dto.project_id ?? null,
	conversation_tag: dto.conversation_tag ?? null,
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

const createConversation = async (conversationName?: string, projectId?: string | null) => {
	const response = await axiosClient.post<ApiResponse<ConversationDto>>(
		'v1/api/conversations',
		{ 
			conversation_name: conversationName,
			project_id: projectId || null
		}
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

/**
 * Update conversation's project
 */
const updateConversationProject = async (conversationId: string, projectId: string | null): Promise<Conversation> => {
	const response = await axiosClient.patch<ApiResponse<ConversationDto>>(
		`v1/api/conversations/${conversationId}/project`,
		{ project_id: projectId }
	);
	return mapConversation(response.data.data);
};

/**
 * Update conversation's tag
 */
const updateConversationTag = async (conversationId: string, tag: string | null): Promise<Conversation> => {

	const response = await axiosClient.patch<ApiResponse<ConversationDto>>(
		`v1/api/conversations/${conversationId}/tag`,
		{ conversation_tag: tag }
	);
	return mapConversation(response.data.data);
};

export default {
	getUserConversations,
	getConversation,
	createConversation,
	renameConversation,
	deleteConversation,
	updateConversationProject,
	updateConversationTag,
};
