import openai from "../config/openai.js";

class GeneratorService {
  private model = openai;

  /**
   * Streaming GPT response
   * @param systemPrompt - hướng dẫn hệ thống
   * @param userPrompt - nội dung tin nhắn user
   * @param maxTokens - giới hạn token cho response
   */
  async streamReply(systemPrompt: string, userPrompt: string, maxTokens: number = 4000): Promise<AsyncGenerator<string>> {
    // ✅ Gọi API ở chế độ streaming với giới hạn token
    const stream = await this.model.chat.completions.stream({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens, // ✅ Giới hạn token
      temperature: 0.7,
    }); 

    // ✅ Trả về Async Generator để đọc từng chunk
    async function* chunkGenerator() {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
    }

    return chunkGenerator();
  }

  async simpleReply(prompt: string): Promise<string> {
    const response = await this.model.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: prompt },
      ],
    });
    return response.choices[0]?.message?.content || "";
  }
  // ... streamReply cũ giữ nguyên

  // generator.service.ts
  async getFullJsonResponse(
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ answer: string; suggestions: string[] }> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" }, 
      temperature: 0.7,
    });
    console.log("Full response from OpenAI:", response);
    const content = response.choices[0].message.content;

    try {
      // content là chuỗi JSON → parse thành object
      return JSON.parse(content || "{}");
    } catch (error) {
      console.error("JSON parse error:", error, "Raw content:", content);
      return {
        answer: "Xin lỗi, đã xảy ra lỗi khi xử lý phản hồi.",
        suggestions: [],
      };
    }
  }

}

export const generatorService = new GeneratorService();
export default generatorService;