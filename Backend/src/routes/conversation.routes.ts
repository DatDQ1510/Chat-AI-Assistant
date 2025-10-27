import { Router } from "express";

import {
  createConversation,
  deleteConversation,
  getConversationById,
  getUserConversations,
  updateConversation,
} from "../controllers/conversation.controller.js";
import { updateConversationProject } from "../controllers/project.controller.js";

const router = Router();

router.post("/", createConversation);
router.get("/", getUserConversations);
router.get("/:id", getConversationById);
router.patch("/:id", updateConversation);
router.delete("/:id", deleteConversation);
router.patch("/:conversation_id/project", updateConversationProject);


export default router;
 