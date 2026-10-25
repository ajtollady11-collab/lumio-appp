"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type Toast = { id: number; tone: "success" | "error"; message: string };
const ToastContext = createContext<((tone: Toast["tone"], message: string) => void) | null>(null);

/** Brief confirmations announced politely to screen readers. Errors stay until dismissed. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const show = useCallback(
    (tone: Toast["tone"], message: string) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-2), { id, tone, message }]);
      if (tone === "success") setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );
  const value = useMemo(() => show, [show]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-fade-in items-start gap-3 rounded-md border bg-surface px-4 py-3 text-sm shadow-raised",
              toast.tone === "error" ? "border-danger/30" : "border-border",
            )}
          >
            {toast.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
            )}
            <p className="flex-1 text-text">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="-m-1 grid size-7 place-items-center rounded-sm text-text-muted hover:bg-surface-muted"
              aria-label="Dismiss"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  return useMemo(
    () => ({
      success: (message: string) => show?.("success", message),
      error: (message: string) => show?.("error", message),
    }),
    [show],
  );
}
