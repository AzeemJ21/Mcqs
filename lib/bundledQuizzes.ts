import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Quiz } from "@/lib/types";

export interface BundledQuizMeta {
  id: string;
  title: string;
  questionCount: number;
  setIndex: number;
}

export interface BundledCatalog {
  source: string;
  totalQuestions: number;
  chunkSize: number;
  quizzes: BundledQuizMeta[];
}

const DATA_DIR = join(process.cwd(), "data");
const CATALOG_FILE = join(DATA_DIR, "catalog.json");
const QUIZZES_DIR = join(DATA_DIR, "quizzes");

const quizCache = new Map<string, Quiz>();

export async function getBundledCatalog(): Promise<BundledCatalog | null> {
  try {
    const raw = await readFile(CATALOG_FILE, "utf-8");
    return JSON.parse(raw) as BundledCatalog;
  } catch {
    return null;
  }
}

export function isBundledQuizId(id: string): boolean {
  return id.startsWith("exam-bank-set-");
}

export async function getBundledQuiz(id: string): Promise<Quiz | null> {
  if (quizCache.has(id)) return quizCache.get(id)!;

  if (!isBundledQuizId(id)) return null;

  try {
    const raw = await readFile(join(QUIZZES_DIR, `${id}.json`), "utf-8");
    const quiz = JSON.parse(raw) as Quiz;
    quizCache.set(id, quiz);
    return quiz;
  } catch {
    return null;
  }
}

/** Preload all bundled quizzes into the in-memory store (optional). */
export async function loadAllBundledIntoStore(
  save: (quiz: Quiz) => void
): Promise<number> {
  const catalog = await getBundledCatalog();
  if (!catalog) return 0;
  let count = 0;
  for (const meta of catalog.quizzes) {
    const quiz = await getBundledQuiz(meta.id);
    if (quiz) {
      save(quiz);
      count++;
    }
  }
  return count;
}
