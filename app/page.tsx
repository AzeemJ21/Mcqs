import Link from "next/link";
import { Brain, FileText, Sparkles, Github } from "lucide-react";
import { BundledQuizList } from "@/components/home/BundledQuizList";
import { DropZone } from "@/components/upload/DropZone";
import { FormatBadges } from "@/components/upload/FormatBadge";

const SAMPLE_SNIPPET = `1. What is the capital of France?
A) Paris
B) London
C) Berlin
D) Madrid
Answer: A

2. What does CPU stand for?
a. Central Processing Unit
b. Computer Personal Unit
c. Central Peripheral Unit
d. Core Processing Unit
Correct Answer: a`;

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-10 sm:py-16">
      <nav className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Brain className="h-5 w-5" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-fg">
            MCQ Platform
          </span>
        </div>
        <a
          href="/sample-questions.txt"
          className="hidden items-center gap-1.5 rounded-full border border-border bg-surface/40 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-fg sm:inline-flex"
          download
        >
          <FileText className="h-3.5 w-3.5" /> Sample file
        </a>
      </nav>

      <section className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Parses DOCX · PDF · TXT
        </span>
        <h1 className="mt-4 text-balance font-display text-4xl font-bold leading-tight text-fg sm:text-5xl md:text-6xl">
          Turn any question file
          <br className="hidden sm:block" /> into an interactive quiz.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-base leading-relaxed text-muted sm:text-lg">
          Drop in a document of multiple-choice questions and start practicing
          instantly — one question at a time, fully scored, and review-ready.
        </p>

        <div className="mt-6">
          <FormatBadges />
        </div>
      </section>

      <BundledQuizList />

      <section className="mt-14">
        <h2 className="mb-4 text-center font-display text-lg font-semibold text-fg">
          Or upload your own file
        </h2>
        <div className="mx-auto max-w-2xl">
          <div className="glass-card p-6 sm:p-8">
            <DropZone />
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-6 sm:grid-cols-2">
        <div className="surface-card p-6">
          <h2 className="font-display text-lg font-semibold text-fg">
            How it works
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-muted">
            {[
              "Pick a ready-made OR MCQs quiz from the question bank on this page.",
              "Or upload your own DOCX, PDF, or TXT — we parse answers automatically.",
              "Answer one question at a time; see the correct answer after each Next.",
              "Review your score and retake any set to improve.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-fg">
              Sample format
            </h2>
            <Link
              href="/sample-questions.txt"
              className="text-xs font-medium text-primary hover:underline"
              prefetch={false}
            >
              Download
            </Link>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-bg/60 p-4 text-xs leading-relaxed text-fg/80">
            <code>{SAMPLE_SNIPPET}</code>
          </pre>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            We also recognize <code>(A) ... *</code> and <code>[correct]</code>{" "}
            inline markers, plus answer keys like{" "}
            <code>Answer:</code> <code>Correct:</code> <code>Ans:</code>{" "}
            <code>Key:</code>.
          </p>
        </div>
      </section>

      <footer className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted sm:flex-row">
        <p>Built with Next.js · Tailwind · Framer Motion</p>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-fg"
        >
          <Github className="h-3.5 w-3.5" /> Stateless · No tracking
        </a>
      </footer>
    </main>
  );
}
