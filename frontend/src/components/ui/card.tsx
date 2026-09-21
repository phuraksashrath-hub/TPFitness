import { cn } from "@/lib/cn";

export function Card({
  className,
  raised = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { raised?: boolean }) {
  return <div className={cn(raised ? "surface-raised" : "surface", className)} {...props} />;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-6 pt-6", className)}>
      <div className="min-w-0">
        <h3 className="font-display text-lg font-bold tracking-tight text-carbon-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-carbon-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <p className="slash mb-3 text-xs font-bold uppercase tracking-[0.16em] text-pulse-500">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-[26px] font-bold leading-tight tracking-tight text-carbon-900 sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-carbon-500">{description}</p>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ash-400 bg-white px-6 py-12 text-center">
      {icon && <div className="text-pulse-500/70">{icon}</div>}
      <p className="font-display text-base font-bold text-carbon-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-carbon-500">{description}</p>}
      {action}
    </div>
  );
}
