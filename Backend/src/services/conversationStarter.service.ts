// src/services/conversationStarter.service.ts
import messageRepository from "../repositories/message.repository.js";
import memoryService from "./memory.service.js";
import { generatorService } from "./generator.service.js";

export const conversationStarterService = {
  /**
   * Generate 3 conversation starters based on user's recent messages and memories
   * @param userId - User ID
   * @param conversationId - Current conversation ID
   * @param limit - Number of recent messages to analyze (default 10)
   * @returns Array of 3 conversation starter suggestions
   */
  async generateStarters(
    userId: string,
    conversationId: string,
    limit: number = 10
  ): Promise<string[]> {
    try {
      console.log(`🎯 Generating conversation starters for user ${userId}`);

      // 1. Get recent user messages from current conversation
      const recentMessages = await messageRepository.getRecentMessagesByUser(
        conversationId,
        userId,
        limit
      );

      // 2. Get user memories
      const memories = await memoryService.searchRelevantMemories(
        userId,
        "user information preferences hobbies interests", // Generic query to get diverse memories
        10 // Get top 10 memories
      );

      // 3. Build context for AI
      const messagesContext = recentMessages.length > 0
        ? `Recent conversation:\n${recentMessages.map((m: any) => `- ${m.content}`).join('\n')}`
        : 'No recent messages in this conversation.';

      const memoriesContext = memories.length > 0
        ? `\n\nUser information:\n${memories.map((m, i) => `${i + 1}. ${m.content}`).join('\n')}`
        : '';

      const systemPrompt = `You are an AI assistant that generates engaging conversation starters.
Your task is to suggest 3 relevant questions or topics based on the user's conversation history and personal information.

Guidelines:
1. Make suggestions relevant to the user's interests and context
2. Questions should be engaging and encourage meaningful conversation
3. Use the user's language (Vietnamese or English based on context)
4. Keep each suggestion concise (max 15 words)
5. Make them actionable and specific

Respond ONLY with a JSON object in this format:
{
  "suggestions": ["question 1", "question 2", "question 3"]
}`;

      const userPrompt = `${messagesContext}${memoriesContext}

Based on the above context, generate 3 engaging conversation starters that would be relevant and helpful for this user.`;

      console.log("📝 Calling AI to generate conversation starters...");

      // 4. Call AI to generate suggestions
      const response = await generatorService.getFullJsonResponse(
        systemPrompt,
        userPrompt
      );

      const suggestions = response.suggestions || [];

      if (suggestions.length === 0) {
        console.warn("⚠️ AI returned no suggestions, using fallbacks");
        return this.getFallbackSuggestions();
      }

      console.log(`✅ Generated ${suggestions.length} conversation starters:`, suggestions);

      return suggestions.slice(0, 3); // Ensure only 3 suggestions
    } catch (error: any) {
      console.error("❌ Error generating conversation starters:", error);
      return this.getFallbackSuggestions();
    }
  },

  /**
   * Fallback suggestions when AI generation fails
   */
  getFallbackSuggestions(): string[] {
    return [
      "Hôm nay bạn có thể giúp tôi điều gì?",
      "Tôi muốn tìm hiểu về một chủ đề mới",
      "Bạn có thể gợi ý cho tôi không?",
    ];
  },
};

export default conversationStarterService;
