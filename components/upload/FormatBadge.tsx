import { FileText, FileType2, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormatBadgeProps {
  format: "DOCX" | "PDF" | "TXT";
}

const ICONS = {
  DOCX: FileType2,
  PDF: FileCode2,
  TXT: FileText,
};

const COLORS = {
  DOCX: "text-sky-300 border-sky-500/30 bg-sky-500/5",
  PDF: "text-rose-300 border-rose-500/30 bg-rose-500/5",
  TXT: "text-emerald-300 border-emerald-500/30 bg-emerald-500/5",
};

export function FormatBadge({ format }: FormatBadgeProps) {
  const Icon = ICONS[format];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        COLORS[format]
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {format}
    </span>
  );
}

export function FormatBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <FormatBadge format="DOCX" />
      <FormatBadge format="PDF" />
      <FormatBadge format="TXT" />
    </div>
  );
}
