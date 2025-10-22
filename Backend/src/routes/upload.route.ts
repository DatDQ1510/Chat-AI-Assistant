import express from "express";
import upload from "../middlewares/multer.middleware.js";
import { uploadFile } from "../controllers/upload.controller.js";

const router = express.Router();
console.log("Upload route initialized");
router.post("/", upload.single("file"), uploadFile);

export default router;
