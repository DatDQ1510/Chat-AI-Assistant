import readPdfFromUrl from "../utils/readPdf";
import { Request, Response, NextFunction } from "express";

export async function extractTextFromPdfUrls(request: Request, response: Response, next: NextFunction) {
  try {
    const { file_urls } = request.body;
    const pdfTexts = await readPdfFromUrl(file_urls);

    return response.status(200).json({ pdfTexts });
  } catch (error) {
    next(error);
  }
}
