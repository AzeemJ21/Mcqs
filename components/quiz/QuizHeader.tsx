"use client";

import * as React from "react";
import { Brain, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { Timer } from "@/components/quiz/Timer";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface QuizHeaderProps {
  title: string;
  currentIndex: number;
  total: number;
  timerSeconds?: number;
  timerKey: string | number;
  onTimerExpire?: () => void;
}

export function QuizHeader({
  title,
  currentIndex,
  total,
  timerSeconds,
  timerKey,
  onTimerExpire,
}: QuizHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-border/60 bg-bg/80 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Brain className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-fg sm:text-base">
              {title}
            </p>
            <p className="text-[11px] uppercase tracking-wider text-muted">
              MCQ Session
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {typeof timerSeconds === "number" && timerSeconds > 0 && (
            <Timer
              seconds={timerSeconds}
              resetKey={timerKey}
              onExpire={onTimerExpire}
            />
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Quit quiz">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Quit</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leave this quiz?</DialogTitle>
                <DialogDescription>
                  Your progress will be lost and you&apos;ll return to the home page.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Stay</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => router.push("/")}
                >
                  Quit Quiz
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ProgressBar current={currentIndex} total={total} />
    </header>
  );
}
