import pdf from "pdf-parse";

export default async function readPdfFromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  console.log(`Fetching PDF from URL: ${url}`); 
  const buffer = Buffer.from(await res.arrayBuffer());
  const data = await pdf(buffer); // ✅ function bình thường
  return data.text;
}
