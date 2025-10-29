import messageRepository from "../repositories/message.repository";
import { embeddingService } from "./embedding.service";
import { User } from "../models/user.model";
import {config} from "dotenv"
import { text } from "stream/consumers";
config();
const MAX_CONTEXT_TOKENS = Number(process.env.MAX_CONTEXT_TOKENS ?? 3000);

// Language name mapping for system prompts
const LANGUAGE_MAP: Record<string, string> = {
  en: "English",
  vi: "Vietnamese (Tiếng Việt)",
  ja: "Japanese (日本語)",
  zh: "Chinese (中文)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  de: "German (Deutsch)",
};

// Writing style instructions
const STYLE_MAP: Record<string, string> = {
  formal: "Use formal, professional language with proper grammar and polite tone.",
  friendly: "Use friendly, warm language while maintaining professionalism.",
  casual: "Use casual, conversational language as if chatting with a friend.",
  technical: "Use technical terminology and detailed explanations suitable for experts.",
  concise: "Keep responses brief and to the point, avoiding unnecessary details.",
  detailed: "Provide comprehensive, thorough explanations with examples.",
};

// Roleplay mode instructions
const ROLEPLAY_MAP: Record<string, string> = {
  mentor: "Act as a wise mentor who guides with insightful advice and constructive feedback.",
  tutor: "Act as a patient tutor who explains concepts step-by-step with examples and encouragement.",
  friend: "Act as a supportive friend who listens empathetically and offers casual, relatable advice.",
  professional: "Act as a professional consultant who provides expert analysis and structured recommendations.",
  coach: "Act as a motivational coach who inspires action and helps set achievable goals.",
  expert: "Act as a domain expert who shares deep knowledge and industry best practices.",
};

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

function truncateByTokenBudget(pieces: string[], userMessage: string, maxTokens: number) {
  const overhead = 200;
  let total = estimateTokens(userMessage) + overhead;
  const kept: string[] = [];
  for (let i = pieces.length - 1; i >= 0; i--) {
    const t = pieces[i];
    const tkn = estimateTokens(t);
    if (total + tkn <= maxTokens) {
      kept.unshift(t);
      total += tkn;
    } else {
      break;
    }
  }
  return kept;
}

export class ContextService {

  // build context using:
  // - recent messages (sliding window)
  // - user preferences (language, writing_style)
  // - suggestions flag (needs_suggestions)
  async buildPrompt(
    conversationId: string, 
    userMessage: string, 
    userId?: string | null,
    needsSuggestions = false,
    text_file_urls?: string
  ) {
    // 1. Recent messages
    const recent = await messageRepository.getRecentMessages(conversationId, 5);
    const recentTexts = recent.length > 0 
      ? recent.map((m: any) => `${m.sender_type.toUpperCase()}: ${m.content}`)
      : [];

    const pdfTexts: string[] = [];
    if (text_file_urls) {
      pdfTexts.push(text_file_urls);
    }

    // 2. User preferences
    let userPreferences = "";
    if (userId) {
      try {
        const user = await User.findByPk(userId, {
          attributes: ["language", "writing_style", "custom_instructions", "roleplay_mode"],
        });
        if (user) {
          const language = user.language || "en";
          const writingStyle = user.writing_style || "friendly";
          const customInstructions = user.custom_instructions || "";
          const roleplayMode = user.roleplay_mode || "";
          
          const languageName = LANGUAGE_MAP[language] || "English";
          const styleInstruction = STYLE_MAP[writingStyle] || STYLE_MAP.friendly;

          let prefs = `Respond in ${languageName}. ${styleInstruction}`;
          
          if (roleplayMode && ROLEPLAY_MAP[roleplayMode]) {
            prefs += ` ${ROLEPLAY_MAP[roleplayMode]}`;
          }
          
          if (customInstructions.trim()) {
            prefs += ` ${customInstructions}`;
          }

          userPreferences = prefs;
        }
      } catch (error) {
        console.error("Error loading user preferences:", error);
      }
    }

    // 3. Suggestions instruction (CHỈ KHI CẦN)
    let suggestionsInstruction = "";
    if (needsSuggestions) {
      suggestionsInstruction = `
      After providing the answer, suggest 3 to 5 follow-up questions the user might ask next.
      Return your response in STRICT JSON format with no additional text.

      {
        "answer": "Your full answer here. Use \\n for line breaks.",
        "suggestions": [
          "Follow-up question 1?",
          "Follow-up question 2?",
          "Follow-up question 3?"
        ]
      }

      "JSON"
      `.trim();
    }

    // 4. Merge context
    const merged = [
      ...recentTexts,
      pdfTexts.length > 0 ? `Reference Documents Content from URLs: ${pdfTexts.join("\n")}` : null
    ].filter(Boolean) as string[];

    // 5. Truncate
    const kept = truncateByTokenBudget(merged, userMessage, MAX_CONTEXT_TOKENS);

    // 6. Assemble prompts
    const baseInstruction = userPreferences 
      ? `You are an AI assistant. ${userPreferences}`
      : `You are an AI assistant.`;

    const systemPrompt = `${baseInstruction}${suggestionsInstruction ? ' ' + suggestionsInstruction : ''}`.trim();
    
    const history = kept.join("\n");
    const userPrompt = `${history}\nUSER: ${userMessage}`;

    return { systemPrompt, userPrompt };
  }
}

const contextService = new ContextService();
export default contextService;
