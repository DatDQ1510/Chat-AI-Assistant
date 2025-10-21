import { Router } from "express";
import { getUsers, getUserSettings, updateUserSettings } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getUsers);
router.get("/settings", getUserSettings); // ✅ Added authenticate
router.patch("/settings", updateUserSettings); // ✅ Added authenticate

export default router;
