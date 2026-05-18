"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Home, RefreshCw } from "lucide-react";
import { useQuizStore } from "@/lib/store/quizStore";
import { ScoreCard } from "@/components/results/ScoreCard";
import { ReviewList } from "@/components/results/ReviewList";
import { ShareButton } from "@/components/results/ShareButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Quiz } from "@/lib/types";

function ResultsSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="skeleton h-56 w-full" />
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-40 w-full" />
    </div>
  );
}

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const quizId = params?.id;

  const quiz = useQuizStore((s) => s.quiz);
  const attempt = useQuizStore((s) => s.attempt);
  const setQuiz = useQuizStore((s) => s.setQuiz);
  const startAttempt = useQuizStore((s) => s.startAttempt);
  const resetQuiz = useQuizStore((s) => s.resetQuiz);
  const getScore = useQuizStore((s) => s.getScore);

  const [loading, setLoading] = React.useState(true);
  const [score, setScore] = React.useState({ correct: 0, total: 0, percentage: 0 });

  React.useEffect(() => {
    if (!quizId) return;
    let cancelled = false;

    const load = async () => {
      try {
        if (!quiz || quiz.id !== quizId) {
          const res = await fetch(`/api/quiz/${quizId}`, { cache: "no-store" });
          if (!res.ok) throw new Error("Quiz not found.");
          const data: Quiz = await res.json();
          if (cancelled) return;
          setQuiz(data);
          if (!attempt || attempt.quizId !== data.id) {
            startAttempt(data.id);
          }
        }
      } catch {
        toast({
          title: "Could not load results",
          description: "Returning you to the home page.",
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

  React.useEffect(() => {
    if (quiz && attempt) {
      setScore(getScore());
    }
  }, [quiz, attempt, getScore]);

  if (loading) return <ResultsSkeleton />;

  if (!quiz || !attempt) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold text-fg">
          No results to show
        </h1>
        <p className="text-sm text-muted">
          Take the quiz first to see your results.
        </p>
        <Button onClick={() => router.push(`/quiz/${quizId}`)}>Take quiz</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <ScoreCard
        correct={score.correct}
        total={score.total}
        percentage={score.percentage}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-fg">Review</h2>
        <div className="flex flex-wrap items-center gap-2">
          <ShareButton
            title={quiz.title}
            correct={score.correct}
            total={score.total}
            percentage={score.percentage}
          />
          <Button
            variant="secondary"
            onClick={() => {
              resetQuiz({ shuffleQuestions: true });
              router.push(`/quiz/${quiz.id}`);
            }}
          >
            <RefreshCw className="h-4 w-4" /> Retake Quiz
          </Button>
          <Button variant="primary" onClick={() => router.push("/")}>
            <Home className="h-4 w-4" /> Upload New
          </Button>
        </div>
      </div>

      <ReviewList questions={quiz.questions} answers={attempt.answers} />
    </main>
  );
}
