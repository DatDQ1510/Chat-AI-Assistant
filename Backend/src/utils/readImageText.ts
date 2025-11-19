// src/utils/readImageText.ts
import Tesseract from "tesseract.js";

export default async function readImageTextFromUrl(url: string): Promise<string> {
  try {
    console.log(`🖼️ Fetching image from URL: ${url}`);

    const { data } = await Tesseract.recognize(url, "eng+vie", {
      logger: (info) => console.log(info.status, info.progress),
    });

    const text = data.text.trim();
    console.log(`✅ Extracted text length: ${text.length}`);
    return text;
  } catch (error) {
    console.error("❌ Error reading image text:", error);
    return "";
  }
}
