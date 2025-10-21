import { Router } from "express";
import { createMessage, getMessagesByConversation, handleReply} from "../controllers/message.controller.js";

const router = Router();

router.post("/", createMessage);
router.get("/:conversation_id", getMessagesByConversation);
router.post("/reply", handleReply);

export default router;
