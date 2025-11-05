import messageRepository from "../repositories/message.repository";
import { User } from "../models/user.model";
import {config} from "dotenv"
import redisConnection from "../config/redis";
import conversationRepository from "../repositories/conversation.repository";
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

  async buildPrompt(
    conversationId: string, 
    userMessage: string, 
    userId?: string | null,
    text_file_urls?: string
  ) {

    const key = `recentMessages:${conversationId}`;
    let recent : any = await redisConnection.lrange(key, 0, 5);
    
    if (!recent.length) {
      // Lấy từ DB và cache lại
      const fromDb = await messageRepository.getRecentMessages(conversationId, 5); 
      console.log("Loaded recent messages from DB:", fromDb);
      
      if (fromDb.length) {
        await redisConnection.del(key);
        for (const msg of fromDb.reverse()) {
          await redisConnection.lpush(key, JSON.stringify(msg));
        }
      }
      recent = fromDb;
    } else {
      recent = recent.map((m: any) => JSON.parse(m));
      console.log("Loaded recent messages from cache:", recent);
    }

    const summarys: string[] = [];
    const summary_key = `summary_${conversationId}`
    let summary : string | null = await redisConnection.get(summary_key);
    if(!summary){
      summary = await conversationRepository.getConversationSummary(conversationId);
      if(summary){
        await redisConnection.setex(summary_key, 24 * 60 * 60, summary);
        console.log("Set summary in key : ", summary_key);
      }
    }

    if(summary) summarys.push(summary);
    
    const recentTexts = recent.length > 0 
      ? recent.map((m: any) => `${m.sender_type.toUpperCase()}: ${m.content}`)
      : [];

    const pdfTexts: string[] = [];
    if (text_file_urls) {
      pdfTexts.push(text_file_urls);
    }

    // 2. User preferences
    let userPreferences = "";
    const userPerferences_key = `userPreferences:${userId}`;
    const cachedPrefs = await redisConnection.get(userPerferences_key);
    if (cachedPrefs) {
      userPreferences = cachedPrefs;
      console.log("Loaded user preferences from cache");
    } else if (userId) {
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
          // Cache preferences
          await redisConnection.setex(userPerferences_key, 24 * 60 * 60, userPreferences);
        }
      } catch (error) {
        console.error("Error loading user preferences:", error);
      }
    }

    // 4. Merge context
    const merged = [
      ...recentTexts,
      pdfTexts.length > 0 ? `Reference Documents Content from URLs: ${pdfTexts.join("\n")}` : null,
      ...summarys,
    ].filter(Boolean) as string[];

    // 5. Truncate
    const kept = truncateByTokenBudget(merged, userMessage, MAX_CONTEXT_TOKENS);

    // 6. Assemble prompts
    const baseInstruction = userPreferences 
      ? `You are an AI assistant. ${userPreferences}`
      : `You are an AI assistant.`;

    const systemPrompt = `${baseInstruction}`.trim();
    
    const history = kept.join("\n");
    const userPrompt = `${history}\nUSER: ${userMessage}`;

    return { systemPrompt, userPrompt };
  }
}

const contextService = new ContextService();
export default contextService;
