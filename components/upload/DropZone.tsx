"use client";

import * as React from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, X, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { UploadResponse } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ACCEPT = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/msword": [".doc"],
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
};

export function DropZone() {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [uploading, setUploading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const onDrop = React.useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setErrorMessage(null);
      if (rejected.length) {
        const err = rejected[0]?.errors?.[0]?.code;
        if (err === "file-too-large") {
          setErrorMessage("File exceeds 10MB limit.");
        } else if (err === "file-invalid-type") {
          setErrorMessage("Only .docx, .txt, and .pdf files are supported.");
        } else {
          setErrorMessage("Could not accept that file.");
        }
        return;
      }
      if (accepted[0]) setFile(accepted[0]);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: ACCEPT,
      maxFiles: 1,
      maxSize: MAX_FILE_SIZE,
      multiple: false,
      disabled: uploading,
    });

  const handleClear = () => {
    setFile(null);
    setProgress(0);
    setErrorMessage(null);
  };

  const handleStart = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMessage(null);
    setProgress(0);

    // Smooth, fake-ish progress while we wait — caps at 90% until response.
    const progressTimer = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(1, (90 - p) * 0.08) : p));
    }, 120);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data: UploadResponse | { error: string } = await res.json();
      if (!res.ok) {
        const msg = "error" in data ? data.error : "Upload failed.";
        throw new Error(msg);
      }
      setProgress(100);
      const ok = data as UploadResponse;
      toast({
        title: "Quiz ready",
        description: `${ok.questionCount} questions parsed.`,
        variant: "success",
      });
      router.push(`/quiz/${ok.quizId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setErrorMessage(msg);
      toast({
        title: "Upload failed",
        description: msg,
        variant: "error",
        action: { label: "Retry", onClick: () => void handleStart() },
      });
    } finally {
      clearInterval(progressTimer);
      setUploading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-surface/40 p-8 text-center transition-all duration-200 hover:border-primary/40 hover:bg-surface/60",
          isDragActive && "border-primary bg-primary/5",
          isDragReject && "border-error bg-error/5",
          uploading && "cursor-not-allowed opacity-80"
        )}
        aria-label="Upload quiz file"
      >
        <input {...getInputProps()} aria-label="Choose a file to upload" />
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <UploadCloud className="h-7 w-7" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-fg">
            {isDragActive ? "Drop the file here" : "Drag & drop your MCQ file"}
          </p>
          <p className="mt-1 text-sm text-muted">
            or <span className="text-primary">browse</span> to pick a file from your device
          </p>
        </div>
        <p className="text-xs text-muted">
          Max 10MB · DOCX, PDF, TXT
        </p>
      </div>

      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="surface-card flex items-center gap-3 p-4"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{file.name}</p>
              <p className="text-xs text-muted">{formatBytes(file.size)}</p>
              {(uploading || progress > 0) && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/60">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut", duration: 0.2 }}
                  />
                </div>
              )}
            </div>
            {!uploading && (
              <button
                onClick={handleClear}
                aria-label="Remove file"
                className="rounded-full p-1.5 text-muted transition-colors hover:bg-bg hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {errorMessage && (
        <p className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Your file is parsed on the server and never stored permanently.
        </p>
        <Button
          onClick={handleStart}
          disabled={!file || uploading}
          size="lg"
          className="min-w-[180px]"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Parsing…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Start Quiz
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
