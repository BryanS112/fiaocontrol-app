"use client";

import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";

export type ToastType = "success" | "warning" | "error";

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

interface ToastBannerProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function ToastBanner({ toast, onDismiss }: ToastBannerProps) {
  if (!toast) return null;

  const styles: Record<ToastType, string> = {
    success:
      "border-emerald-pos/30 bg-surface text-foreground",
    warning:
      "border-amber-pos/40 bg-surface text-foreground",
    error:
      "border-coral-pos/40 bg-surface text-foreground",
  };

  const Icon =
    toast.type === "success"
      ? CheckCircle2
      : toast.type === "warning"
        ? AlertTriangle
        : XCircle;

  const iconColor =
    toast.type === "success"
      ? "text-emerald-pos"
      : toast.type === "warning"
        ? "text-amber-pos"
        : "text-coral-pos";

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-3 md:bottom-6"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm ${styles[toast.type]}`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} aria-hidden="true" />
          <p className="text-sm font-medium leading-snug">{toast.text}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar notificación"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
