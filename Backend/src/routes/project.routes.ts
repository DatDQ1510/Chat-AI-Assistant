import { Router } from "express";
import { 
    createProject,
    getProjectsByUserId,
    deleteProject,
    updateProject,
    getConversationByProjectId,
    updateConversationProject,
    getByProjectId
} from "../controllers/project.controller.js";

const router = Router();

router.post("/", createProject);
router.get("/", getProjectsByUserId);
router.delete("/:project_id", deleteProject);
router.patch("/:project_id", updateProject);
router.get("/:project_id/conversations", getConversationByProjectId);
router.get("/:project_id", getByProjectId);

export default router;
