import { Request, Response, NextFunction } from "express";
import messageService from "../services/message.service";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { genAI } from "../config/genAI";
/**
 * @desc Create a message from user
 */
export const createMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { conversation_id, content } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json(errorResponse("Unauthorized"));
    }

    if (!conversation_id || !content) {
      return res.status(400).json(errorResponse("Missing conversation_id or content"));
    }

    // Save user message
    const userMessage = await messageService.createMessage(
      conversation_id,
      "user",
      String(user_id),
      null,
      content
    );

    res
      .status(201)
      .json(successResponse(userMessage, "User message saved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get messages by conversation ID (with pagination)
 */
export const getMessagesByConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const conversation_id = req.params.conversation_id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await messageService.getMessagesByConversationId(
      conversation_id,
      limit,
      page
    );
    console.log("Controller fetched messages:", result);

    res
      .status(200)
      .json(successResponse(result, "Messages fetched successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Handle chatbot reply message (server-side)
 */
export const handleReply = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { conversation_id, chatbot_id, content } = req.body;

    if (!conversation_id || !content) {
      return res
        .status(400)
        .json(errorResponse("Missing conversation_id or content"));
    }

    // 1️⃣ Lưu tin nhắn user gửi trước
    await messageService.createMessage(
      conversation_id,
      "user",
      (req.user as any)?.id || null,
      chatbot_id || null,
      content
    );

    // 2️⃣ Gọi AI Gemini để lấy câu trả lời
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash", 
    });
    const aiResponse = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: content }] }],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        stopSequences: ["\n\n"],
      },
    });

    const replyText = aiResponse.response.text();

    // 3️⃣ Lưu câu trả lời AI vào DB
    const replyMessage = await messageService.createMessage(
      conversation_id,
      "chatbot",
      null,
      chatbot_id || null,
      replyText
    );

    // 4️⃣ Trả về
    return res
      .status(201)
      .json(successResponse(replyMessage, "Chatbot replied successfully"));

  } catch (error) {
    console.error(error);
    next(error);
  }
};
