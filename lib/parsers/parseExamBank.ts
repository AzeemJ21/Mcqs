import { nanoid } from "nanoid";
import type { Question, Option } from "@/lib/types";

const BLOCK_RE = /([\s\S]*?)\n\s*ANSWER:\s*([A-E])\s*(?:\n|$)/gi;
const OPTION_PREFIX_RE = /^\s*([A-E])\s*[\.\):\-]\s+(.+)$/i;
const SECTION_HEADER_RE =
  /^-{2,}.*CLO\d.*-{2,}$|^\s*CLO\s*\d+\s*[-:]*\s*$/i;

function isSectionHeader(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (SECTION_HEADER_RE.test(t)) return true;
  if (t.length < 120 && !t.includes("?") && /^[A-Z0-9\s\-–—]+$/.test(t)) {
    return /CLO\s*\d/i.test(t);
  }
  return false;
}

function parseOptionSegment(segment: string): Option | null {
  const line = segment.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  if (!line) return null;
  const prefixed = line.match(OPTION_PREFIX_RE);
  if (prefixed) {
    return { id: prefixed[1].toUpperCase(), text: prefixed[2].trim() };
  }
  return null;
}

function assignSequentialIds(options: { text: string }[]): Option[] {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  return options.map((o, i) => ({
    id: letters[i] ?? String(i + 1),
    text: o.text,
  }));
}

function parseBlock(body: string, answerLetter: string): Question | null {
  const segments = body
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !isSectionHeader(s));

  if (segments.length < 3) return null;

  const questionText = segments[0].replace(/\s+/g, " ").trim();
  if (!questionText || questionText.length < 10) return null;

  const prefixed: Option[] = [];
  const plain: { text: string }[] = [];

  for (const seg of segments.slice(1)) {
    const opt = parseOptionSegment(seg);
    if (opt) prefixed.push(opt);
    else {
      const text = seg.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
      if (text) plain.push({ text });
    }
  }

  let options: Option[];
  if (prefixed.length >= 2 && prefixed.length >= plain.length) {
    options = prefixed;
  } else if (plain.length >= 2) {
    options = assignSequentialIds(plain);
  } else {
    const combined = [
      ...prefixed,
      ...assignSequentialIds(plain),
    ];
    const byId = new Map<string, Option>();
    for (const o of combined) byId.set(o.id, o);
    options = Array.from(byId.values()).sort((a, b) =>
      a.id.localeCompare(b.id)
    );
  }

  const byId = new Map<string, Option>();
  for (const o of options) byId.set(o.id, o);
  options = Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));

  if (options.length < 2) return null;

  const correct = answerLetter.toUpperCase();
  let correctOptionId = correct;
  if (!byId.has(correct)) {
    const idx = correct.charCodeAt(0) - "A".charCodeAt(0);
    if (idx < 0 || idx >= options.length) return null;
    correctOptionId = options[idx].id;
  }

  return {
    id: nanoid(8),
    text: questionText,
    options,
    correctOptionId,
  };
}

/** Parses CLO exam-bank plain text (from DOCX export). */
export function parseExamBank(raw: string): Question[] {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const questions: Question[] = [];
  const re = new RegExp(BLOCK_RE.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = re.exec(normalized)) !== null) {
    const q = parseBlock(match[1], match[2]);
    if (q) questions.push(q);
  }

  return questions;
}
