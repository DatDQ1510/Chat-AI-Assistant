import { sequelize } from "../config/database.js";
import { Conversation } from "../models/conversation.model";

class ConversationRepository {

    async createConversation(user_id: string, conversation_name?: string, project_id?: string | null): Promise<Conversation> {
        return Conversation.create({
            user_id,
            conversation_name: conversation_name || "New Chat", // tên mặc định
            project_id: project_id || null // Mặc định không thuộc dự án nào
        });
    }

    async getConversationsByUserId(user_id: string, limit: number, offset: number): Promise<{ rows: Conversation[]; count: number }> {
        return Conversation.findAndCountAll({
            where: { user_id, project_id: null }, // Chỉ lấy các cuộc trò chuyện không thuộc dự án nào
            order: [["updatedAt", "DESC"]], // ✅ Order by most recent first
            limit,
            offset,
            attributes: ["conversation_name", "id", "createdAt", "updatedAt", "user_id", "project_id", "conversation_tag"], // ✅ Include project_id and conversation_tag
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

    async updateConversation(id: string, conversation_name?: string): Promise<void> {
        await Conversation.update(
            { conversation_name },
            { where: { id } }
        );
    }

    async getConversationByProjectId(project_id: string): Promise<Conversation[] | null> {
        return Conversation.findAll({
            where: { project_id },
            attributes: ["conversation_name", "id", "updatedAt"],
        });
    }
    async updateConversationProject(conversation_id: string, project_id: string | null): Promise<Conversation | null> {
        const [updatedRows] = await Conversation.update(
            { project_id },
            { where: { id: conversation_id } }
        );
        if (updatedRows === 0) return null;
        const updated = await this.getConversationById(conversation_id);
        return updated;
    }

    async updateTagConversation(conversation_id: string, conversation_tag: string): Promise<Conversation | null> {
        const [updatedRows] = await Conversation.update(
            { conversation_tag },
            { where: { id: conversation_id } }
        );
        if (updatedRows === 0) return null;
        const updated = await this.getConversationById(conversation_id);
        return updated;
    }

    /**
     * Touch conversation to update updatedAt timestamp
     * This is used when a new message is added to trigger conversation list reordering
     */
    async touchConversation(conversation_id: string): Promise<boolean> {
        try {
        const now = new Date();
        const [result]: any[] = await sequelize.query(
            `
            UPDATE "conversations"
            SET "updatedAt" = NOW()
            WHERE "id" = $1
            RETURNING "id", "updatedAt";
            `,
            { bind: [conversation_id] }
        );

        if (Array.isArray(result) && result.length > 0) {
            const { updatedAt } = result[0];
            return true;
        } else {

            return false;
        }
        } catch (error: any) {
        return false;
        }
    }
    async getConversationSummary(conversation_id: string): Promise<string | null> {
        const recorded = await Conversation.findByPk(conversation_id,
            {
                attributes: ['summary']
            }
        )
        return recorded?.summary || null;
    }
}
export default new ConversationRepository();