import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "carbon" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

/** Every interactive control is a full capsule — see "Shapes" in the Kinetic Pulse spec. */
const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-200 focus-pulse disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-pulse-500 text-white shadow-[0_8px_20px_-8px_rgba(230,27,35,0.6)] hover:bg-pulse-600 hover:shadow-pulse active:scale-[0.98]",
  carbon: "bg-carbon-900 text-white hover:bg-carbon-800 active:scale-[0.98]",
  outline:
    "border-2 border-pulse-500 bg-white text-pulse-500 hover:bg-pulse-50 active:scale-[0.98]",
  ghost: "text-carbon-500 hover:bg-ash-200 hover:text-carbon-900",
  danger: "bg-ember-500 text-white hover:bg-ember-600 active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

interface LinkButtonProps extends React.ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
