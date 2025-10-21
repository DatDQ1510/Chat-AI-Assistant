import { Request, Response } from "express";
import ConversationService from "../services/conversation.service.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";


/**
 * @desc create a new conversation
 * @route POST v1/api/conversations
 */
export const createConversation = async (req: Request, res: Response, next: Function) => {
  try {
    console.log(1)
    const { conversation_name } = req.body;
    console.log(conversation_name);
    const user_id = req.user?.id; // Get user_id from authenticated user

    if (!user_id) {
      return res.status(401).json(errorResponse("Unauthorized"));
    }

    const newConversation = await ConversationService.createConversation(
      user_id,
      conversation_name
    );

    res
      .status(201)
      .json(successResponse(newConversation, "Conversation created successfully"));
  } catch (error: any) {
        next(error);
  }
};

/**
 * @desc Get user conversations
 * @route GET v1/api/conversations?page=1&limit=10
 */
export const getUserConversations = async (req: Request, res: Response, next: Function) => {
  try {
    console.log(1);

    const user_id = req.user?.id;
    if (!user_id)
      return res.status(401).json(errorResponse("Unauthorized"));

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { rows, count } = await ConversationService.getConversationsByUserId(
      user_id,
      limit,
      page
    );

    res.status(200).json(
      successResponse(
        {
          conversations: rows,
          pagination: {
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
          },
        },
        "Conversations fetched successfully"
      )
    );
  } catch (error: any) {
    next(error);
  }
};

/**
 * @desc Get conversation by ID
 * @route GET v1/api/conversations/:id
 */
export const getConversationById = async (req: Request, res: Response, next: Function) => {
  try {
    const { id } = req.params;
    const conversation = await ConversationService.getConversationById(String(id));

    if (!conversation)
      return res.status(404).json(errorResponse("Conversation not found"));

    res
      .status(200)
      .json(successResponse(conversation, "Conversation fetched successfully"));
  } catch (error: any) {
    next(error);
  }
};

/**
 * @desc Update conversation name
 * @route PUT v1/api/conversations/:id
 */
export const updateConversation = async (req: Request, res: Response, next: Function) => {
  try {
    const { id } = req.params;
    const { conversation_name } = req.body;

    await ConversationService.updateConversation(String(id), conversation_name);
    res
      .status(200)
      .json(successResponse(null, "Conversation updated successfully"));
  } catch (error: any) {
    next(error);
  }
};

/**
 * @desc Delete a conversation
 * @route DELETE v1/api/conversations/:id
 */
export const deleteConversation = async (req: Request, res: Response, next: Function) => {
  try {
    const { id } = req.params;

    await ConversationService.deleteConversation(String(id));
    res
      .status(200)
      .json(successResponse(null, "Conversation deleted successfully"));
  } catch (error: any) {
    next(error);
  }
};
