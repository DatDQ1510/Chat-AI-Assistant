import { Conversation } from "../models/conversation.model";
import messageRepository from "../repositories/message.repository";
import generatorService  from "./generator.service";

class SummaryService {
    async generateSummary(conversationId: string): Promise<void | null> {
        const lastSummariedIndex = await messageRepository.getLastSummariedIndex(conversationId);
        const messages = await messageRepository.getMessagesByConversationId(conversationId, 10, lastSummariedIndex);
        
        const contentToSummarize = messages.map((m: any) =>
            `${m.sender_type.toUpperCase()}: ${m.content}`)
            .join("\n");
        const lastSummary = (await Conversation.findByPk(conversationId))?.summary;
        const prompt = `Tóm tắt nội dung chính của cuộc hội thoại sau:
                        ${lastSummary ? `Dựa trên tóm tắt trước đó: ${lastSummary}` : ""}
                        \n Nội dung kế tiếp : ${contentToSummarize}`;
        
        const summary = await generatorService.simpleReply(prompt);

        await messageRepository.updateConversationSummary(conversationId, summary, lastSummariedIndex + 10);
    }
}
const summaryService = new SummaryService();   
export default summaryService; 
