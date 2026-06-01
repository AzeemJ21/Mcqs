import { readFile, writeFile } from "node:fs/promises";
import mammoth from "mammoth";

const path = "assets/MCQs Bank for OR.docx";
const buf = await readFile(path);
const { value } = await mammoth.extractRawText({ buffer: buf });
await writeFile("assets/or-extracted-raw.txt", value, "utf-8");
console.log("Chars:", value.length);
console.log("ANSWER count:", (value.match(/ANSWER:/gi) || []).length);
console.log("--- first 4000 chars ---\n");
console.log(value.slice(0, 4000));
