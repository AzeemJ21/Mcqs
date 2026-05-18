"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Question } from "@/lib/types";
import { OptionButton } from "@/components/quiz/OptionButton";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  index: number;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
  /** After user clicks Next once, show which option was correct. */
  answerRevealed?: boolean;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  index,
  selectedOptionId,
  onSelect,
  answerRevealed = false,
  disabled,
}: QuestionCardProps) {
  const isCorrect =
    Boolean(selectedOptionId) &&
    selectedOptionId === question.correctOptionId;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="glass-card p-6 sm:p-8"
      >
        <div className="mb-6 flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 font-display text-sm font-semibold text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h2 className="text-balance font-display text-xl font-semibold leading-snug text-fg sm:text-2xl">
            {question.text}
          </h2>
        </div>

        <AnimatePresence>
          {answerRevealed && selectedOptionId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 overflow-hidden"
            >
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
                  isCorrect
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-error/40 bg-error/10 text-error"
                )}
                role="status"
              >
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0" />
                )}
                <div className="min-w-0 leading-relaxed">
                  {isCorrect ? (
                    <span className="font-medium text-fg">
                      Correct — nice work.
                    </span>
                  ) : (
                    <>
                      <span className="font-medium text-fg">
                        Correct answer:{" "}
                        <span className="text-success">
                          {question.correctOptionId}
                        </span>
                        {(() => {
                          const co = question.options.find(
                            (o) => o.id === question.correctOptionId
                          );
                          return co ? (
                            <span className="text-muted">
                              {" "}
                              — {co.text}
                            </span>
                          ) : null;
                        })()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-3">
          {question.options.map((opt, i) => (
            <OptionButton
              key={opt.id}
              label={opt.id}
              text={opt.text}
              selected={selectedOptionId === opt.id}
              onClick={() => onSelect(opt.id)}
              disabled={disabled || answerRevealed}
              shortcut={String(i + 1)}
              showAnswer={answerRevealed}
              isCorrectOption={opt.id === question.correctOptionId}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
