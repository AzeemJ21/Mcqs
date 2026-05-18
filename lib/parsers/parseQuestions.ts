import { nanoid } from "nanoid";
import type { Question, Option } from "@/lib/types";

/**
 * Parses raw text containing MCQ questions into structured Question objects.
 *
 * Strategy: scan line-by-line into "blocks". Lines are classified as
 *   - answer line (e.g. "Answer: A")
 *   - option line (e.g. "A) text", "1. text", "(b) text")
 *   - question starter (ends with ? OR has a Q:/numbered prefix)
 *   - everything else (treated as continuation or buffered as a candidate
 *     question line for the case where the question doesn't end with '?').
 *
 * Disambiguation: a numeric label like `1. ` could be either a numbered
 * question prefix OR a numeric option. We treat it as a question if either
 *   (a) the line ends with '?', or
 *   (b) we are not currently inside a question that already has options.
 */

const OPTION_LABEL_RE =
  /^\s*(?:\(|\[)?\s*([A-Ha-h]|[1-8])\s*(?:\)|\]|\.|:|-)\s+(.+?)\s*$/;

const ANSWER_LINE_RE =
  /^\s*(?:answer|correct\s*answer|correct|ans|key)\s*[:\-]\s*(?:\(|\[)?\s*([A-Ha-h]|[1-8])\s*(?:\)|\])?\s*\.?\s*$/i;

const QUESTION_PREFIX_RE =
  /^\s*(?:Q\s*[:.\-)]\s*|Question\s*\d*\s*[:.\-)]\s*|\d+\s*[.)\-:]\s+)/i;

const EXPLANATION_PREFIX_RE = /^(explanation|reason)\s*[:\-]\s*/i;

const INLINE_CORRECT_MARKERS: RegExp[] = [
  /\*\s*$/,
  /\[correct\]\s*$/i,
  /\(correct\)\s*$/i,
];

const NUMBER_TO_LETTER: Record<string, string> = {
  "1": "A",
  "2": "B",
  "3": "C",
  "4": "D",
  "5": "E",
  "6": "F",
  "7": "G",
  "8": "H",
};

interface RawOption {
  label: string;
  text: string;
  marked: boolean;
}

interface RawBlock {
  questionLines: string[];
  options: RawOption[];
  explicitAnswer?: string;
  explanation?: string;
  /** True once the block has an answer (explicit or inline marker). */
  sealed?: boolean;
}

function normalizeLabel(raw: string): string {
  const upper = raw.toUpperCase();
  return NUMBER_TO_LETTER[upper] ?? upper;
}

function stripQuestionPrefix(line: string): string {
  return line.replace(QUESTION_PREFIX_RE, "").trim();
}

function extractInlineMarker(text: string): { text: string; marked: boolean } {
  for (const re of INLINE_CORRECT_MARKERS) {
    if (re.test(text)) {
      return { text: text.replace(re, "").trim(), marked: true };
    }
  }
  return { text: text.trim(), marked: false };
}

function looksLikeSectionHeader(line: string): boolean {
  if (!line) return false;
  if (line.length > 80) return false;
  if (line.includes("?")) return false;
  if (OPTION_LABEL_RE.test(line)) return false;
  if (ANSWER_LINE_RE.test(line)) return false;
  if (QUESTION_PREFIX_RE.test(line)) return false;
  const letters = line.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;
  return letters === letters.toUpperCase();
}

function isQuestionStarter(line: string): boolean {
  if (/\?\s*$/.test(line)) return true;
  if (/^\s*Q\s*[:.\-)]/i.test(line)) return true;
  if (/^\s*Question\b/i.test(line)) return true;
  // Numbered questions (e.g. "1. xxx?") will be caught by '?' above. The
  // ambiguous case `1. xxx` (no question mark) is resolved by the caller
  // using context — see tokenize().
  return false;
}

function tokenize(raw: string): RawBlock[] {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\u00a0/g, " ").trimEnd());

  const blocks: RawBlock[] = [];
  let current: RawBlock | null = null;
  /** Lines we haven't yet decided what to do with (potential question text). */
  let buffer: string[] = [];
  /** True when the next non-empty line should extend the explanation. */
  let captureExplanation = false;
  /**
   * Set when a sealed block sees a blank line. The next non-blank line will
   * trigger a flush before being processed as new content. This lets us
   * detect new questions that don't have an explicit `?` or `Q:` prefix.
   */
  let pendingFlush = false;

  const flush = () => {
    if (
      current &&
      (current.questionLines.length > 0 || current.options.length > 0)
    ) {
      blocks.push(current);
    }
    current = null;
    captureExplanation = false;
    pendingFlush = false;
  };

  for (const rawLine of lines) {
    const t = rawLine.trim();

    if (!t) {
      captureExplanation = false;
      if (current?.sealed) pendingFlush = true;
      continue;
    }

    if (pendingFlush) {
      flush();
    }

    if (looksLikeSectionHeader(t)) {
      flush();
      buffer = [];
      continue;
    }

    const answerMatch = t.match(ANSWER_LINE_RE);
    if (answerMatch && current) {
      current.explicitAnswer = normalizeLabel(answerMatch[1]);
      current.sealed = true;
      captureExplanation = true;
      continue;
    }

    const optionMatch = t.match(OPTION_LABEL_RE);
    const explicitQuestion = isQuestionStarter(t);

    // Unambiguous question lines (end with '?', or start with Q:/Question)
    // ALWAYS start a new block, even if the text also matches an option shape.
    if (explicitQuestion) {
      flush();
      const lead = stripQuestionPrefix(t);
      current = {
        questionLines: [...buffer.map(stripQuestionPrefix), lead],
        options: [],
      };
      buffer = [];
      continue;
    }

    if (optionMatch) {
      const label = normalizeLabel(optionMatch[1]);
      const { text, marked } = extractInlineMarker(optionMatch[2]);

      if (current) {
        current.options.push({ label, text, marked });
        if (marked) current.sealed = true;
        captureExplanation = false;
        continue;
      }
      // No current question: try to promote buffered text into a question
      // and treat this line as the first option.
      if (buffer.length > 0) {
        current = {
          questionLines: buffer.map(stripQuestionPrefix),
          options: [{ label, text, marked }],
        };
        if (marked) current.sealed = true;
        buffer = [];
        captureExplanation = false;
        continue;
      }
      // Bare numeric prefix without buffer/current is most likely a numbered
      // question stem (e.g. `1. Apple is a fruit.`) rather than an orphan
      // option — promote it to a question.
      if (/^\s*\d+\s*[.)\-:]\s+/.test(t)) {
        current = { questionLines: [stripQuestionPrefix(t)], options: [] };
        continue;
      }
      // Truly orphaned option with no context — skip.
      continue;
    }

    // Plain continuation line.
    if (current) {
      if (current.options.length === 0) {
        current.questionLines.push(t);
      } else if (captureExplanation) {
        const cleaned = t.replace(EXPLANATION_PREFIX_RE, "");
        current.explanation = current.explanation
          ? `${current.explanation} ${cleaned}`
          : cleaned;
      } else {
        const last = current.options[current.options.length - 1];
        last.text = `${last.text} ${t}`.trim();
      }
    } else {
      buffer.push(t);
    }
  }

  flush();
  return blocks;
}

function buildQuestion(block: RawBlock): Question | null {
  const text = block.questionLines.join(" ").replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (block.options.length < 2) return null;

  // Deduplicate by label, keeping the last occurrence.
  const byLabel = new Map<string, { text: string; marked: boolean }>();
  for (const opt of block.options) {
    byLabel.set(opt.label, { text: opt.text, marked: opt.marked });
  }

  const sortedLabels = Array.from(byLabel.keys()).sort();
  const options: Option[] = sortedLabels.map((label) => ({
    id: label,
    text: byLabel.get(label)!.text,
  }));

  let correctOptionId: string | undefined;
  if (block.explicitAnswer && byLabel.has(block.explicitAnswer)) {
    correctOptionId = block.explicitAnswer;
  } else {
    const marked = sortedLabels.find((l) => byLabel.get(l)!.marked);
    if (marked) correctOptionId = marked;
  }

  if (!correctOptionId) return null;

  return {
    id: nanoid(8),
    text,
    options,
    correctOptionId,
    explanation: block.explanation,
  };
}

export function parseQuestions(raw: string): Question[] {
  if (!raw || !raw.trim()) {
    throw new Error(
      "The uploaded file appears to be empty. Please upload a file containing MCQ questions."
    );
  }

  const blocks = tokenize(raw);
  const questions: Question[] = [];
  for (const block of blocks) {
    const q = buildQuestion(block);
    if (q) questions.push(q);
  }

  if (questions.length < 1) {
    throw new Error(
      "Could not detect any questions. Please check your file format and refer to the sample format below."
    );
  }

  return questions;
}
