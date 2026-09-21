"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "w-full rounded-lg border border-ash-400 bg-white px-4 text-sm text-carbon-900 placeholder:text-ash-500 transition-colors focus-pulse focus:border-pulse-500 disabled:bg-ash-100 disabled:opacity-70";

interface FieldWrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  id: string;
  children: React.ReactNode;
}

function FieldWrapper({ label, hint, error, id, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-[13px] font-bold tracking-[0.04em] text-carbon-700"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-ember-500">{error}</p>
      ) : (
        hint && <p className="text-xs text-carbon-500">{hint}</p>
      )}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldWrapper label={label} hint={hint} error={error} id={fieldId}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={cn(fieldBase, "h-11", error && "border-ember-500", className)}
        {...props}
      />
    </FieldWrapper>
  );
});

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldWrapper label={label} hint={hint} error={error} id={fieldId}>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={cn(fieldBase, "min-h-24 py-3 leading-relaxed", error && "border-ember-500", className)}
        {...props}
      />
    </FieldWrapper>
  );
});

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldWrapper label={label} hint={hint} error={error} id={fieldId}>
      <select
        ref={ref}
        id={fieldId}
        className={cn(fieldBase, "h-11 appearance-none bg-[position:right_0.9rem_center] pr-10", className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%23585862' stroke-width='2'%3E%3Cpath d='M3 5l4 4 4-4'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
        }}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
});
