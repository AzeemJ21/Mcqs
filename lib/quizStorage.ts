import type { Quiz } from "@/lib/types";

/**
 * Lightweight in-memory quiz store. In serverless environments persistence will
 * not survive cold starts, but it is sufficient for this stateless demo. We
 * stash the Map on globalThis so HMR doesn't blow it away in dev.
 */
type Store = Map<string, Quiz>;

const GLOBAL_KEY = "__mcq_quiz_store__";

function getStore(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new Map<string, Quiz>();
  }
  return g[GLOBAL_KEY]!;
}

export function saveQuiz(quiz: Quiz): void {
  getStore().set(quiz.id, quiz);
}

export function getQuiz(id: string): Quiz | undefined {
  return getStore().get(id);
}

export function listQuizIds(): string[] {
  return Array.from(getStore().keys());
}
