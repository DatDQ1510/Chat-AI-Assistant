import express from "express";
import upload from "../middlewares/multer.middleware.js";
import { uploadFile } from "../controllers/upload.controller.js";
import { extractTextFromPdfUrls } from "../controllers/pdf.controller.js";
const router = express.Router();
router.post("/", upload.single("file"), uploadFile);
router.post("/upload-pdf", extractTextFromPdfUrls);

export default router;
