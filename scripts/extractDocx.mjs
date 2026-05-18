import { readFile, writeFile } from "node:fs/promises";
import mammoth from "mammoth";

const docxPath =
  "assets/FInal Exam-Question Bank (CLO3, CLO4) SC.docx";
const outPath = "assets/extracted-raw.txt";

const buf = await readFile(docxPath);
const { value } = await mammoth.extractRawText({ buffer: buf });
await writeFile(outPath, value, "utf-8");
console.log("Chars:", value.length);
console.log("Lines:", value.split("\n").length);
console.log("--- first 3000 chars ---");
console.log(value.slice(0, 3000));
