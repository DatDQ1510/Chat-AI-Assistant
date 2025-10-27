import { Conversation } from "../models/conversation.model";

class ConversationRepository {

    async createConversation(user_id: number, conversation_name?: string): Promise<Conversation> {
        return Conversation.create({
            user_id,
            conversation_name: conversation_name || "New Chat", // tên mặc định
        });
    }


    async getConversationsByUserId(user_id: number, limit: number, offset: number): Promise<{ rows: Conversation[]; count: number }> {
        return Conversation.findAndCountAll({
            where: { user_id },
            order: [["updatedAt", "DESC"]], // ✅ Order by most recent first
            limit,
            offset,
            attributes: ["conversation_name", "id", "createdAt", "updatedAt", "user_id"],
        });
    }

    async getConversationById(id: string): Promise<Conversation | null> {
        return Conversation.findByPk(id);
    }

    async deleteConversation(id: string): Promise<void> {
        await Conversation.destroy(
            { where: { id } }
        );
    }

    async updateConversation(id: string, conversation_name: string): Promise<void> {
        await Conversation.update(
            { conversation_name },
            { where: { id } }
        );
    }
}
export default new ConversationRepository();