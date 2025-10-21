import { Router } from "express";

import {
  createConversation,
  deleteConversation,
  getConversationById,
  getUserConversations,
  updateConversation,
} from "../controllers/conversation.controller.js";

const router = Router();

router.post("/", createConversation);
router.get("/", getUserConversations);
router.get("/:id", getConversationById);
router.patch("/:id", updateConversation);
router.delete("/:id", deleteConversation);

export default router;
 