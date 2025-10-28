import { sequelize } from "../config/database.js";
import { Conversation } from "../models/conversation.model";

class ConversationRepository {

    async createConversation(user_id: string, conversation_name?: string): Promise<Conversation> {
        return Conversation.create({
            user_id,
            conversation_name: conversation_name || "New Chat", // tên mặc định
        });
    }


    async getConversationsByUserId(user_id: string, limit: number, offset: number): Promise<{ rows: Conversation[]; count: number }> {
        return Conversation.findAndCountAll({
            where: { user_id },
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
            where: { project_id }
        });
    }
    async updateConversationProject(conversation_id: string, project_id: string | null): Promise<Conversation | null> {
        console.log(`📝 [Backend] Updating conversation ${conversation_id} to project ${project_id || 'null (unlink)'}`);
        const [updatedRows] = await Conversation.update(
            { project_id },
            { where: { id: conversation_id } }
        );
        console.log(`✅ [Backend] Updated ${updatedRows} row(s)`);
        if (updatedRows === 0) return null;
        const updated = await this.getConversationById(conversation_id);
        console.log(`✅ [Backend] Conversation now has project_id:`, updated?.project_id);
        return updated;
    }

    async updateTagConversation(conversation_id: string, conversation_tag: string): Promise<Conversation | null> {
        console.log(`📝 [Backend] Updating conversation ${conversation_id} tag to ${conversation_tag}`)
        const [updatedRows] = await Conversation.update(
            { conversation_tag },
            { where: { id: conversation_id } }
        );
        console.log(`✅ [Backend] Updated ${updatedRows} row(s)`);
        if (updatedRows === 0) return null;
        const updated = await this.getConversationById(conversation_id);
        console.log(`✅ [Backend] Conversation now has tag:`, updated?.conversation_tag);
        return updated;
    }

    /**
     * Touch conversation to update updatedAt timestamp
     * This is used when a new message is added to trigger conversation list reordering
     */
    async touchConversation(conversation_id: string): Promise<boolean> {
        try {
        const now = new Date();
        console.log(`🔄 [Repository] Touching conversation ${conversation_id} at ${now.toISOString()}`);

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
            console.log(`✅ [Repository] updatedAt refreshed: ${updatedAt}`);
            return true;
        } else {
            console.warn(`⚠️ [Repository] No rows found for conversation ${conversation_id}`);
            return false;
        }
        } catch (error: any) {
        console.error(`❌ [Repository] Failed to touch conversation ${conversation_id}:`, error.message || error);
        return false;
        }
    }
}
export default new ConversationRepository();