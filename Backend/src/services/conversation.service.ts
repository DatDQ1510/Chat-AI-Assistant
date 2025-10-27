import ConversationRepository from "../repositories/conversation.repository";

class ConversationService {
    private conversationRepository = ConversationRepository;

    async createConversation(user_id: string, conversation_name: string) {
        return this.conversationRepository.createConversation(user_id, conversation_name);
    }

    async getConversationsByUserId(user_id: string, limit = 10, page = 1) {
        const offset = (page - 1) * limit;
        return this.conversationRepository.getConversationsByUserId(user_id, limit, offset);
    }

    async getConversationById(id: string) {
        return this.conversationRepository.getConversationById(id);
    }

    async deleteConversation(id: string) {
        return this.conversationRepository.deleteConversation(id);
    }

    async updateConversation(id: string, conversation_name?: string) {
        return this.conversationRepository.updateConversation(id, conversation_name);
    }

    async getConversationByProjectId(project_id: string) {
        return this.conversationRepository.getConversationByProjectId(project_id);
    }
    async updateConversationProject(conversation_id: string, project_id: string) {
        return this.conversationRepository.updateConversationProject(conversation_id, project_id);
    }
}

export default new ConversationService();
