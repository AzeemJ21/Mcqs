"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OptionButtonProps {
  label: string;
  text: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  shortcut?: string;
  /** When true, show correct / incorrect styling (quiz feedback step). */
  showAnswer?: boolean;
  isCorrectOption?: boolean;
}

export function OptionButton({
  label,
  text,
  selected,
  onClick,
  disabled,
  shortcut,
  showAnswer,
  isCorrectOption,
}: OptionButtonProps) {
  const revealed = Boolean(showAnswer);
  const correct = Boolean(isCorrectOption);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.99 }}
      whileHover={{ y: disabled || revealed ? 0 : -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all duration-200",
        !revealed &&
          "border-border bg-surface/60 hover:border-primary/40 hover:bg-card",
        !revealed &&
          selected &&
          "border-primary/70 bg-primary/10 shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_10px_30px_-12px_rgba(99,102,241,0.45)]",
        revealed && correct && "border-success/50 bg-success/10 shadow-none",
        revealed && !correct && selected && "border-error/50 bg-error/10 shadow-none",
        revealed && !correct && !selected && "border-border/50 bg-surface/30 opacity-60",
        "disabled:cursor-not-allowed disabled:opacity-60"
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg border font-display text-sm font-semibold transition-all duration-200",
          revealed && correct && "border-success/60 bg-success text-white",
          revealed && !correct && selected && "border-error/60 bg-error text-white",
          revealed && !correct && !selected && "border-border bg-card/80 text-muted",
          !revealed &&
            selected &&
            "border-primary/70 bg-primary text-primary-foreground",
          !revealed &&
            !selected &&
            "border-border bg-card text-muted group-hover:text-fg"
        )}
        aria-hidden="true"
      >
        {label}
      </span>
      <span className="min-w-0 flex-1 text-sm leading-relaxed text-fg sm:text-base">
        {text}
      </span>
      {revealed && correct && (
        <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
          Correct
        </span>
      )}
      {revealed && !correct && selected && (
        <span className="rounded-full bg-error/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-error">
          Your answer
        </span>
      )}
      {shortcut && !revealed && (
        <span
          className="hidden items-center gap-1 rounded-md border border-border bg-bg/60 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted sm:inline-flex"
          aria-hidden="true"
        >
          {shortcut}
        </span>
      )}
    </motion.button>
  );
}
