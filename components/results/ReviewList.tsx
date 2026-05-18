"use client";

import { motion } from "framer-motion";
import { Check, X, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";

interface ReviewListProps {
  questions: Question[];
  answers: Record<string, string>;
}

export function ReviewList({ questions, answers }: ReviewListProps) {
  return (
    <div className="grid gap-4">
      {questions.map((q, idx) => {
        const userAnswer = answers[q.id];
        const isCorrect = userAnswer === q.correctOptionId;
        const wasAnswered = Boolean(userAnswer);

        return (
          <motion.article
            key={q.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
            className="surface-card overflow-hidden"
          >
            <header className="flex items-start gap-3 border-b border-border/60 p-5">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold",
                  isCorrect
                    ? "bg-success/10 text-success"
                    : wasAnswered
                      ? "bg-error/10 text-error"
                      : "bg-warning/10 text-warning"
                )}
                aria-label={
                  isCorrect ? "Correct" : wasAnswered ? "Incorrect" : "Skipped"
                }
              >
                {isCorrect ? (
                  <Check className="h-4 w-4" />
                ) : wasAnswered ? (
                  <X className="h-4 w-4" />
                ) : (
                  <MinusCircle className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Question {idx + 1}
                </p>
                <h3 className="mt-1 text-balance font-display text-base font-semibold text-fg sm:text-lg">
                  {q.text}
                </h3>
              </div>
            </header>

            <ul className="grid gap-2 p-5">
              {q.options.map((opt) => {
                const isUserPick = userAnswer === opt.id;
                const isCorrectOpt = q.correctOptionId === opt.id;
                let cls =
                  "border-border bg-surface/40 text-fg/90";
                if (isCorrectOpt) {
                  cls = "border-success/40 bg-success/5 text-success";
                } else if (isUserPick && !isCorrectOpt) {
                  cls = "border-error/40 bg-error/5 text-error";
                }
                return (
                  <li
                    key={opt.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm",
                      cls
                    )}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-current/30 text-xs font-semibold">
                      {opt.id}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                    {isCorrectOpt && (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                        Correct
                      </span>
                    )}
                    {isUserPick && !isCorrectOpt && (
                      <span className="rounded-full bg-error/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-error">
                        Your Pick
                      </span>
                    )}
                    {isUserPick && isCorrectOpt && (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                        Your Pick
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {q.explanation && (
              <div className="border-t border-border/60 bg-bg/30 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Explanation
                </p>
                <p className="mt-1 text-sm leading-relaxed text-fg/90">
                  {q.explanation}
                </p>
              </div>
            )}
          </motion.article>
        );
      })}
    </div>
  );
}
