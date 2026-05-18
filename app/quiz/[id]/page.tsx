"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Flag } from "lucide-react";
import { useQuizStore } from "@/lib/store/quizStore";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Quiz } from "@/lib/types";

const TIMER_SECONDS = 0; // Set to e.g. 30 to enable per-question countdown.

function QuizSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <div className="skeleton h-20 w-full" />
      <div className="skeleton h-72 w-full" />
      <div className="flex justify-between gap-3">
        <div className="skeleton h-11 w-28" />
        <div className="skeleton h-11 w-32" />
      </div>
    </div>
  );
}

export default function QuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const quizId = params?.id;

  const quiz = useQuizStore((s) => s.quiz);
  const attempt = useQuizStore((s) => s.attempt);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const setQuiz = useQuizStore((s) => s.setQuiz);
  const startAttempt = useQuizStore((s) => s.startAttempt);
  const toggleAnswer = useQuizStore((s) => s.toggleAnswer);
  const nextQuestion = useQuizStore((s) => s.nextQuestion);
  const prevQuestion = useQuizStore((s) => s.prevQuestion);
  const completeQuiz = useQuizStore((s) => s.completeQuiz);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  /** First Next click reveals correct answer; second advances (or finishes). */
  const [answerRevealed, setAnswerRevealed] = React.useState(false);

  // Fetch quiz on mount (or whenever id changes / store doesn't have it).
  React.useEffect(() => {
    if (!quizId) return;
    let cancelled = false;

    const load = async () => {
      if (quiz?.id === quizId && attempt?.quizId === quizId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/quiz/${quizId}`, { cache: "no-store" });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(
            data?.error ?? "Quiz not found. It may have expired."
          );
        }
        const data: Quiz = await res.json();
        if (cancelled) return;
        setQuiz(data);
        startAttempt(data.id);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Could not load this quiz.";
        setError(msg);
        toast({
          title: "Could not load quiz",
          description: msg,
          variant: "error",
        });
        setTimeout(() => router.push("/"), 1500);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const currentQuestion = quiz?.questions[currentIndex];

  React.useEffect(() => {
    setAnswerRevealed(false);
  }, [currentQuestion?.id]);

  const isLast = quiz ? currentIndex === quiz.questions.length - 1 : false;
  const selectedOptionId = currentQuestion
    ? attempt?.answers[currentQuestion.id]
    : undefined;

  const handleFinish = React.useCallback(() => {
    if (!quiz) return;
    completeQuiz();
    router.push(`/results/${quiz.id}`);
  }, [quiz, completeQuiz, router]);

  const handlePrimary = React.useCallback(() => {
    if (!quiz || !currentQuestion || !selectedOptionId) return;
    if (!answerRevealed) {
      setAnswerRevealed(true);
      return;
    }
    if (isLast) {
      handleFinish();
    } else {
      nextQuestion();
    }
  }, [
    quiz,
    currentQuestion,
    selectedOptionId,
    answerRevealed,
    isLast,
    handleFinish,
    nextQuestion,
  ]);

  // Keyboard navigation: 1-4 / a-d to select; arrows to nav; Enter to confirm; Space to toggle current.
  React.useEffect(() => {
    if (!currentQuestion) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const numericIndex = "1234".indexOf(e.key);
      const letterIndex = "abcd".indexOf(e.key.toLowerCase());
      const optIdx = numericIndex >= 0 ? numericIndex : letterIndex;
      if (optIdx >= 0 && optIdx < currentQuestion.options.length) {
        if (answerRevealed) return;
        e.preventDefault();
        toggleAnswer(currentQuestion.id, currentQuestion.options[optIdx].id);
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (!selectedOptionId) return;
        handlePrimary();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevQuestion();
        return;
      }
      if (e.key === "Enter") {
        if (selectedOptionId) {
          e.preventDefault();
          handlePrimary();
        }
        return;
      }
      if (e.key === " " && selectedOptionId && !answerRevealed) {
        e.preventDefault();
        toggleAnswer(currentQuestion.id, selectedOptionId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentQuestion, selectedOptionId, answerRevealed, toggleAnswer, prevQuestion, handlePrimary]);

  if (loading) return <QuizSkeleton />;

  if (error || !quiz || !currentQuestion) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold text-fg">
          Quiz unavailable
        </h1>
        <p className="text-sm text-muted">
          {error ?? "We couldn't load this quiz. Please upload your file again."}
        </p>
        <Button onClick={() => router.push("/")}>Back to home</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <QuizHeader
        title={quiz.title}
        currentIndex={currentIndex}
        total={quiz.questions.length}
        timerSeconds={TIMER_SECONDS}
        timerKey={currentQuestion.id}
        onTimerExpire={handlePrimary}
      />

      <QuestionCard
        question={currentQuestion}
        index={currentIndex}
        selectedOptionId={selectedOptionId}
        onSelect={(optId) => toggleAnswer(currentQuestion.id, optId)}
        answerRevealed={answerRevealed}
      />

      <motion.div
        layout
        className="flex items-center justify-between gap-3"
      >
        <Button
          variant="ghost"
          onClick={prevQuestion}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </Button>

        <div className="hidden text-xs text-muted sm:block">
          {!answerRevealed ? (
            <>
              Tip: press <kbd className="rounded border border-border bg-surface px-1">1</kbd>–
              <kbd className="rounded border border-border bg-surface px-1">4</kbd> to
              select · <kbd className="rounded border border-border bg-surface px-1">Enter</kbd> to
              reveal answer
            </>
          ) : (
            <>
              Press <kbd className="rounded border border-border bg-surface px-1">Enter</kbd> or{" "}
              <kbd className="rounded border border-border bg-surface px-1">→</kbd> to continue
            </>
          )}
        </div>

        <Button onClick={handlePrimary} disabled={!selectedOptionId}>
          {!answerRevealed ? (
            <>
              Next <ArrowRight className="h-4 w-4" />
            </>
          ) : isLast ? (
            <>
              <Flag className="h-4 w-4" /> Finish Quiz
            </>
          ) : (
            <>
              Continue <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </motion.div>
    </main>
  );
}
