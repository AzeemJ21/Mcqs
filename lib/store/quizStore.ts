"use client";

import { create } from "zustand";
import type { Quiz, QuizAttempt } from "@/lib/types";
import { shuffle } from "@/lib/utils";

interface ScoreSummary {
  correct: number;
  total: number;
  percentage: number;
}

interface QuizStore {
  quiz: Quiz | null;
  attempt: QuizAttempt | null;
  currentIndex: number;

  setQuiz: (quiz: Quiz) => void;
  startAttempt: (quizId: string) => void;
  answerQuestion: (questionId: string, optionId: string) => void;
  toggleAnswer: (questionId: string, optionId: string) => void;
  goToIndex: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  completeQuiz: () => void;
  resetQuiz: (options?: { shuffleQuestions?: boolean }) => void;
  getScore: () => ScoreSummary;
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  quiz: null,
  attempt: null,
  currentIndex: 0,

  setQuiz: (quiz) => {
    const existing = get().quiz;
    // Avoid clobbering an in-progress attempt for the same quiz id.
    if (existing && existing.id === quiz.id) {
      set({ quiz });
      return;
    }
    set({
      quiz,
      attempt: null,
      currentIndex: 0,
    });
  },

  startAttempt: (quizId) => {
    set({
      attempt: {
        quizId,
        answers: {},
        startedAt: new Date().toISOString(),
      },
      currentIndex: 0,
    });
  },

  answerQuestion: (questionId, optionId) => {
    const { attempt } = get();
    if (!attempt) return;
    set({
      attempt: {
        ...attempt,
        answers: { ...attempt.answers, [questionId]: optionId },
      },
    });
  },

  toggleAnswer: (questionId, optionId) => {
    const { attempt } = get();
    if (!attempt) return;
    const current = attempt.answers[questionId];
    const next = { ...attempt.answers };
    if (current === optionId) {
      delete next[questionId];
    } else {
      next[questionId] = optionId;
    }
    set({ attempt: { ...attempt, answers: next } });
  },

  goToIndex: (index) => {
    const { quiz } = get();
    if (!quiz) return;
    const clamped = Math.max(0, Math.min(quiz.questions.length - 1, index));
    set({ currentIndex: clamped });
  },

  nextQuestion: () => {
    const { quiz, currentIndex } = get();
    if (!quiz) return;
    if (currentIndex < quiz.questions.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) set({ currentIndex: currentIndex - 1 });
  },

  completeQuiz: () => {
    const { attempt } = get();
    if (!attempt) return;
    set({
      attempt: { ...attempt, completedAt: new Date().toISOString() },
    });
  },

  resetQuiz: (options) => {
    const { quiz } = get();
    if (!quiz) {
      set({ attempt: null, currentIndex: 0 });
      return;
    }
    const nextQuiz: Quiz = options?.shuffleQuestions
      ? { ...quiz, questions: shuffle(quiz.questions) }
      : quiz;
    set({
      quiz: nextQuiz,
      attempt: {
        quizId: nextQuiz.id,
        answers: {},
        startedAt: new Date().toISOString(),
      },
      currentIndex: 0,
    });
  },

  getScore: () => {
    const { quiz, attempt } = get();
    if (!quiz || !attempt) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    for (const q of quiz.questions) {
      if (attempt.answers[q.id] === q.correctOptionId) correct += 1;
    }
    const total = quiz.questions.length;
    const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);
    return { correct, total, percentage };
  },
}));
