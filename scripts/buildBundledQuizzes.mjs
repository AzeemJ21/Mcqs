/**
 * Build bundled quiz JSON from assets question bank.
 * Run: npm run build:quizzes
 */
import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import mammoth from "mammoth";

const ROOT = join(import.meta.dirname, "..");
const SOURCE_FILE = "MCQs Bank for OR.docx";
const SOURCE_PATH = join(ROOT, "assets", SOURCE_FILE);
const OUT_DIR = join(ROOT, "data", "quizzes");
const CATALOG_PATH = join(ROOT, "data", "catalog.json");
const CHUNK_SIZE = 50;
const QUIZ_ID_PREFIX = "or-bank-set-";
const BANK_TITLE = "Operations Research (OR) MCQs Bank";

const BLOCK_RE = /([\s\S]*?)\n\s*ANSWER:\s*([A-E])\s*(?:\n|$)/gi;
const OPTION_LINE_RE = /^\s*([A-E])\s*[\.\):\-]\s+(.+)$/i;
const SECTION_HEADER_RE =
  /^-{2,}.*CLO\d.*-{2,}$|^\s*CLO\s*\d+\s*[-:]*\s*$|^\s*OR\s+Question\s+Bank\s*$/i;

function isSectionHeader(text) {
  const t = text.trim();
  if (!t) return true;
  if (SECTION_HEADER_RE.test(t)) return true;
  if (/^\s*(question\s+)?bank\s*$/i.test(t)) return true;
  if (t.length < 120 && !t.includes("?") && /^[A-Z0-9\s\-–—]+$/.test(t)) {
    return /CLO\s*\d/i.test(t) || /question\s+bank/i.test(t);
  }
  return false;
}

function parseOptionLine(line) {
  const m = line.trim().match(OPTION_LINE_RE);
  if (!m) return null;
  return { id: m[1].toUpperCase(), text: m[2].trim() };
}

function assignSequentialIds(options) {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  return options.map((o, i) => ({
    id: letters[i] ?? String(i + 1),
    text: o.text,
  }));
}

/** One line per option (TXT / compact format). */
function parseBlockByLines(body, answerLetter) {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !isSectionHeader(l));

  if (lines.length < 3) return null;

  const questionLines = [];
  const options = [];

  for (const line of lines) {
    const opt = parseOptionLine(line);
    if (opt) {
      options.push(opt);
    } else if (options.length === 0) {
      questionLines.push(line);
    } else {
      options[options.length - 1].text += ` ${line}`;
    }
  }

  const questionText = questionLines.join(" ").replace(/\s+/g, " ").trim();
  if (!questionText || questionText.length < 10 || options.length < 2) return null;

  return finalizeQuestion(questionText, options, answerLetter);
}

/** Blank-line-separated paragraphs (DOCX export style). */
function parseBlockByParagraphs(body, answerLetter) {
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
    const line = seg.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    const opt = parseOptionLine(line);
    if (opt) prefixed.push(opt);
    else if (line) plain.push({ text: line });
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

  if (options.length < 2) return null;
  return finalizeQuestion(questionText, options, answerLetter);
}

function finalizeQuestion(questionText, options, answerLetter) {
  const byId = new Map();
  for (const o of options) byId.set(o.id, o);
  options = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));

  const correct = answerLetter.toUpperCase();
  let correctOptionId = correct;
  if (!byId.has(correct)) {
    const idx = correct.charCodeAt(0) - "A".charCodeAt(0);
    if (idx < 0 || idx >= options.length) return null;
    correctOptionId = options[idx].id;
  }

  return { text: questionText, options, correctOptionId };
}

function parseBlock(body, answerLetter) {
  return (
    parseBlockByParagraphs(body, answerLetter) ??
    parseBlockByLines(body, answerLetter)
  );
}

function parseQuestionBank(raw) {
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

async function removeOldQuizzes() {
  const files = await readdir(OUT_DIR).catch(() => []);
  for (const f of files) {
    if (f.endsWith(".json") && !f.startsWith(QUIZ_ID_PREFIX)) {
      await unlink(join(OUT_DIR, f));
      console.log(`  Removed old quiz file: ${f}`);
    }
  }
}

async function loadSourceText() {
  if (SOURCE_FILE.toLowerCase().endsWith(".docx")) {
    const buf = await readFile(SOURCE_PATH);
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value;
  }
  return readFile(SOURCE_PATH, "utf-8");
}

const raw = await loadSourceText();
const parsed = parseQuestionBank(raw);

console.log(`Parsed ${parsed.length} questions from ${SOURCE_FILE}`);

if (parsed.length < 10) {
  console.error("Too few questions parsed — check file format.");
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });
await removeOldQuizzes();

const sets = chunk(parsed, CHUNK_SIZE);
const catalog = {
  source: BANK_TITLE,
  sourceFile: SOURCE_FILE,
  totalQuestions: parsed.length,
  chunkSize: CHUNK_SIZE,
  quizzes: [],
};

for (let i = 0; i < sets.length; i++) {
  const setNum = String(i + 1).padStart(2, "0");
  const id = `${QUIZ_ID_PREFIX}${setNum}`;
  const questions = sets[i].map((q, qi) => ({
    id: `${id}-q${String(qi + 1).padStart(3, "0")}`,
    text: q.text,
    options: q.options,
    correctOptionId: q.correctOptionId,
  }));

  const quiz = {
    id,
    title: `OR MCQs — Quiz ${i + 1} (${questions.length} questions)`,
    questions,
    createdAt: new Date().toISOString(),
    bundled: true,
    setIndex: i + 1,
    sourceFile: SOURCE_FILE,
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
