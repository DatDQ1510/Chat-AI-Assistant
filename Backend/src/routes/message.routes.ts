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
router.post("/reply", handleReply);
router.post("/search", searchMessages);
router.patch("/:messageId/important", toggleImportant);
router.get("/important/:conversationId", getImportantMessages); // Move before generic /:conversation_id
router.get("/:conversation_id", getMessagesByConversation);

export default router;
