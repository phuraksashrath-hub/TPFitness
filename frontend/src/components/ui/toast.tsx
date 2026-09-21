"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  push: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, string> = {
  success: "border-jade-500 text-jade-600",
  error: "border-ember-500 text-ember-500",
  info: "border-pulse-500 text-pulse-600",
};

const toneIcon: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="size-4" />,
  error: <TriangleAlert className="size-4" />,
  info: <Info className="size-4" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, tone, message }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (message: string) => push(message, "success"),
      error: (message: string) => push(message, "error"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-6 z-100 flex w-[min(22rem,calc(100vw-3rem))] flex-col gap-3"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex animate-rise items-start gap-3 rounded-xl border-l-4 border border-ash-300 bg-white px-4 py-3 text-sm shadow-[0_16px_40px_-18px_rgba(17,17,22,0.35)]",
              toneStyles[toast.tone],
            )}
          >
            <span className="mt-0.5">{toneIcon[toast.tone]}</span>
            <p className="flex-1 text-carbon-700">{toast.message}</p>
            <button
              type="button"
              onClick={() => remove(toast.id)}
              aria-label="ปิดการแจ้งเตือน"
              className="text-ash-600 transition-colors hover:text-carbon-900"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>.");
  return ctx;
}
