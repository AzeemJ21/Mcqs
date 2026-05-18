// pdf-parse's main entry tries to read a debug PDF fixture at module load.
// Importing the inner implementation file directly avoids that side-effect.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function parsePdf(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text;
}
