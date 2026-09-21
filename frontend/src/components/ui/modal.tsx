"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

  return (
    <div className="fixed inset-0 z-90 flex items-end justify-center bg-carbon-950/55 p-4 backdrop-blur-sm sm:items-center">
      <button
        type="button"
        aria-label="ปิดหน้าต่าง"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "surface relative z-10 w-full animate-rise overflow-hidden",
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ash-300 px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-carbon-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-carbon-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-full p-1.5 text-carbon-500 transition-colors hover:bg-ash-200 hover:text-carbon-900 focus-pulse"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-ash-300 bg-ash-50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
