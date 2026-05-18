import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function getPercentageBand(pct: number): {
  label: string;
  tone: "red" | "amber" | "green" | "gold";
} {
  if (pct >= 91) return { label: "Perfect Score!", tone: "gold" };
  if (pct >= 71) return { label: "Well Done", tone: "green" };
  if (pct >= 41) return { label: "Good Effort", tone: "amber" };
  return { label: "Keep Practicing", tone: "red" };
}

export function toneClasses(tone: "red" | "amber" | "green" | "gold"): {
  text: string;
  bg: string;
  ring: string;
  stroke: string;
} {
  switch (tone) {
    case "gold":
      return {
        text: "text-gold",
        bg: "bg-gold/10",
        ring: "ring-gold/40",
        stroke: "#fbbf24",
      };
    case "green":
      return {
        text: "text-success",
        bg: "bg-success/10",
        ring: "ring-success/40",
        stroke: "#22c55e",
      };
    case "amber":
      return {
        text: "text-warning",
        bg: "bg-warning/10",
        ring: "ring-warning/40",
        stroke: "#f59e0b",
      };
    case "red":
    default:
      return {
        text: "text-error",
        bg: "bg-error/10",
        ring: "ring-error/40",
        stroke: "#ef4444",
      };
  }
}
