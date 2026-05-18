"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn, getPercentageBand, toneClasses } from "@/lib/utils";

interface ScoreCardProps {
  correct: number;
  total: number;
  percentage: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.2,
      ease: "easeOut",
    });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, motionValue, rounded]);

  return <span className="tabular-nums">{display}</span>;
}

export function ScoreCard({ correct, total, percentage }: ScoreCardProps) {
  const band = getPercentageBand(percentage);
  const tone = toneClasses(band.tone);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dash = (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card grid gap-8 p-8 sm:grid-cols-[auto_1fr] sm:items-center"
    >
      <div className="relative mx-auto h-44 w-44">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            strokeWidth="12"
            className="stroke-border/60"
          />
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            strokeWidth="12"
            stroke={tone.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-display text-5xl font-bold", tone.text)}>
            <AnimatedNumber value={percentage} />
            <span className="text-2xl">%</span>
          </span>
          <span className="mt-1 text-xs uppercase tracking-wider text-muted">
            Score
          </span>
        </div>
      </div>

      <div className="text-center sm:text-left">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider",
            tone.bg,
            tone.text,
            "border-current/30"
          )}
        >
          {band.label}
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold text-fg sm:text-4xl">
          You scored{" "}
          <span className={tone.text}>
            <AnimatedNumber value={correct} />
          </span>{" "}
          / {total}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {percentage >= 91
            ? "Outstanding! You aced this quiz with a near-perfect run."
            : percentage >= 71
              ? "Strong performance — most answers correct on the first try."
              : percentage >= 41
                ? "Solid foundation. Review the missed questions and try again."
                : "Don't worry — review the explanations below and retake the quiz."}
        </p>
      </div>
    </motion.div>
  );
}
