import { Router } from "express";
import { 
    createMessage, 
    getMessagesByConversation, 
    handleReply, 
    toggleImportant,
    getImportantMessages,
    searchMessages
} from "../controllers/message.controller.js";

const router = Router();

router.post("/", createMessage);
router.get("/:conversation_id", getMessagesByConversation);
router.post("/reply", handleReply);
router.patch("/:messageId/important", toggleImportant);
router.get("/:conversationId/important", getImportantMessages);
router.post("/search", searchMessages);
export default router;
