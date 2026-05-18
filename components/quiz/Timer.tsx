"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

interface TimerProps {
  /** Seconds to count down from. */
  seconds: number;
  /** Reset key — when changed, the timer restarts. */
  resetKey: string | number;
  /** Called when the countdown reaches zero. */
  onExpire?: () => void;
  active?: boolean;
}

export function Timer({ seconds, resetKey, onExpire, active = true }: TimerProps) {
  const [remaining, setRemaining] = React.useState(seconds);
  const onExpireRef = React.useRef(onExpire);

  React.useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  React.useEffect(() => {
    setRemaining(seconds);
  }, [resetKey, seconds]);

  React.useEffect(() => {
    if (!active) return;
    if (remaining <= 0) {
      onExpireRef.current?.();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, active]);

  const lowTime = remaining <= 5;
  const pct = Math.max(0, (remaining / Math.max(1, seconds)) * 100);

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium tabular-nums",
          lowTime ? "text-error" : "text-fg"
        )}
        aria-live="polite"
      >
        <Clock className="h-3.5 w-3.5" />
        {formatTime(remaining)}
      </div>
      <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-border/60 sm:block">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            lowTime ? "bg-error" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
