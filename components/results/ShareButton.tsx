"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface ShareButtonProps {
  title: string;
  correct: number;
  total: number;
  percentage: number;
}

export function ShareButton({ title, correct, total, percentage }: ShareButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const summary = `🧠 ${title}\nScore: ${correct}/${total} (${percentage}%)\nTaken on ${new Date().toLocaleDateString()}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast({ title: "Copied to clipboard", variant: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Couldn't copy",
        description: "Your browser blocked clipboard access.",
        variant: "error",
      });
    }
  };

  return (
    <Button variant="secondary" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="h-4 w-4 text-success" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" /> Copy Results
        </>
      )}
    </Button>
  );
}
