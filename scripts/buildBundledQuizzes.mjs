/**
 * Build bundled quiz JSON from assets DOCX. Run: node scripts/buildBundledQuizzes.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import mammoth from "mammoth";
const ROOT = join(import.meta.dirname, "..");
const DOCX = join(
  ROOT,
  "assets",
  "FInal Exam-Question Bank (CLO3, CLO4) SC.docx"
);
const OUT_DIR = join(ROOT, "data", "quizzes");
const CATALOG_PATH = join(ROOT, "data", "catalog.json");
const CHUNK_SIZE = 50;

const BLOCK_RE = /([\s\S]*?)\n\s*ANSWER:\s*([A-E])\s*(?:\n|$)/gi;
const OPTION_PREFIX_RE = /^\s*([A-E])\s*[\.\):\-]\s+(.+)$/i;
const SECTION_HEADER_RE =
  /^-{2,}.*CLO\d.*-{2,}$|^\s*CLO\s*\d+\s*[-:]*\s*$/i;

function isSectionHeader(text) {
  const t = text.trim();
  if (!t) return true;
  if (SECTION_HEADER_RE.test(t)) return true;
  if (t.length < 120 && !t.includes("?") && /^[A-Z0-9\s\-–—]+$/.test(t)) {
    return /CLO\s*\d/i.test(t);
  }
  return false;
}

function parseOptionSegment(segment) {
  const line = segment.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  if (!line) return null;
  const prefixed = line.match(OPTION_PREFIX_RE);
  if (prefixed) return { id: prefixed[1].toUpperCase(), text: prefixed[2].trim() };
  return null;
}

function assignSequentialIds(options) {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  return options.map((o, i) => ({
    id: letters[i] ?? String(i + 1),
    text: o.text,
  }));
}

function parseBlock(body, answerLetter) {
  const segments = body
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !isSectionHeader(s));

  if (segments.length < 3) return null;

  const questionText = segments[0].replace(/\s+/g, " ").trim();
  if (!questionText || questionText.length < 10) return null;

  const prefixed = [];
  const plain = [];

  for (const seg of segments.slice(1)) {
    const opt = parseOptionSegment(seg);
    if (opt) prefixed.push(opt);
    else {
      const text = seg.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
      if (text) plain.push({ text });
    }
  }

  let options;
  if (prefixed.length >= 2 && prefixed.length >= plain.length) {
    options = prefixed;
  } else if (plain.length >= 2) {
    options = assignSequentialIds(plain);
  } else {
    const combined = [...prefixed, ...assignSequentialIds(plain)];
    const byId = new Map();
    for (const o of combined) byId.set(o.id, o);
    options = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  const byId = new Map();
  for (const o of options) byId.set(o.id, o);
  options = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  if (options.length < 2) return null;

  const correct = answerLetter.toUpperCase();
  let correctOptionId = correct;
  if (!byId.has(correct)) {
    const idx = correct.charCodeAt(0) - "A".charCodeAt(0);
    if (idx < 0 || idx >= options.length) return null;
    correctOptionId = options[idx].id;
  }

  return { text: questionText, options, correctOptionId };
}

function parseExamBank(raw) {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const questions = [];
  const re = new RegExp(BLOCK_RE.source, "gi");
  let match;
  while ((match = re.exec(normalized)) !== null) {
    const q = parseBlock(match[1], match[2]);
    if (q) questions.push(q);
  }
  return questions;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const buf = await readFile(DOCX);
const { value } = await mammoth.extractRawText({ buffer: buf });
const parsed = parseExamBank(value);

console.log(`Parsed ${parsed.length} questions from DOCX`);

if (parsed.length < 50) {
  console.error("Too few questions parsed — check format.");
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

const sets = chunk(parsed, CHUNK_SIZE);
const catalog = {
  source: "Final Exam-Question Bank (CLO3, CLO4) SC",
  totalQuestions: parsed.length,
  chunkSize: CHUNK_SIZE,
  quizzes: [],
};

for (let i = 0; i < sets.length; i++) {
  const setNum = String(i + 1).padStart(2, "0");
  const id = `exam-bank-set-${setNum}`;
  const questions = sets[i].map((q, qi) => ({
    id: `${id}-q${String(qi + 1).padStart(3, "0")}`,
    text: q.text,
    options: q.options,
    correctOptionId: q.correctOptionId,
  }));

  const quiz = {
    id,
    title: `Final Exam Bank — Quiz ${i + 1} (${questions.length} MCQs)`,
    questions,
    createdAt: new Date().toISOString(),
    bundled: true,
    setIndex: i + 1,
    sourceFile: "FInal Exam-Question Bank (CLO3, CLO4) SC.docx",
  };

  await writeFile(
    join(OUT_DIR, `${id}.json`),
    JSON.stringify(quiz, null, 2),
    "utf-8"
  );

  catalog.quizzes.push({
    id,
    title: quiz.title,
    questionCount: questions.length,
    setIndex: i + 1,
  });

  console.log(`  Wrote ${id}.json (${questions.length} questions)`);
}

await writeFile(CATALOG_PATH, JSON.stringify(catalog, null, 2), "utf-8");
console.log(`\nCatalog: ${CATALOG_PATH}`);
console.log(`Total sets: ${sets.length}`);
