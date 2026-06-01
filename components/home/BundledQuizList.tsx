import Link from "next/link";
import { BookOpen, ChevronRight, Layers } from "lucide-react";
import { getBundledCatalog } from "@/lib/bundledQuizzes";

export async function BundledQuizList() {
  const catalog = await getBundledCatalog();

  if (!catalog || catalog.quizzes.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Operations Research (OR) MCQs
            </span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold text-fg">
            Start a quiz — no upload needed
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            {catalog.totalQuestions} MCQs from{" "}
            <span className="text-fg/90">{catalog.source}</span>, split into{" "}
            {catalog.quizzes.length} sets of up to {catalog.chunkSize} questions
            each.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm text-muted">
          <Layers className="h-4 w-4 text-primary" />
          <span>
            <strong className="text-fg">{catalog.quizzes.length}</strong> quizzes
            ready
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {catalog.quizzes.map((q) => (
          <Link
            key={q.id}
            href={`/quiz/${q.id}`}
            className="group surface-card flex items-center gap-4 p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 font-display text-lg font-bold text-primary">
              {q.setIndex}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold text-fg sm:text-base">
                {q.title}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {q.questionCount} multiple-choice questions · tap to start
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </section>
  );
}
