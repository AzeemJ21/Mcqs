"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "info" | "success" | "error" | "warning";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toast: (
    t: Omit<ToastItem, "id" | "variant"> & { variant?: ToastVariant }
  ) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

const ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

const TONE: Record<ToastVariant, string> = {
  info: "border-primary/40 text-fg",
  success: "border-success/40 text-fg",
  error: "border-error/40 text-fg",
  warning: "border-warning/40 text-fg",
};

const ICON_TONE: Record<ToastVariant, string> = {
  info: "text-primary",
  success: "text-success",
  error: "text-error",
  warning: "text-warning",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>((t) => {
    const id = Math.random().toString(36).slice(2);
    const variant: ToastVariant = t.variant ?? "info";
    setItems((prev) => [...prev, { ...t, id, variant }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:top-6">
        <AnimatePresence>
          {items.map((t) => {
            const Icon = ICONS[t.variant];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.96 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn(
                  "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-card/95 p-4 shadow-2xl backdrop-blur-xl",
                  TONE[t.variant]
                )}
                role="status"
              >
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", ICON_TONE[t.variant])} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-muted">{t.description}</p>
                  )}
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick();
                        dismiss(t.id);
                      }}
                      className="mt-2 text-xs font-semibold text-primary hover:underline"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="rounded-full p-1 text-muted transition-colors hover:bg-surface hover:text-fg"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
