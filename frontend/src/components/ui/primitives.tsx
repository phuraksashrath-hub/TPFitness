import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const dimension = { width: size, height: size };

  if (src) {
    return (
      // Remote avatars come from arbitrary member-supplied URLs, so the plain img tag avoids
      // having to whitelist every host in next.config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={dimension}
        className={cn("rounded-full border-2 border-white object-cover shadow-card", className)}
      />
    );
  }

  return (
    <div
      style={dimension}
      aria-label={name}
      className={cn(
        "flex items-center justify-center rounded-full border border-pulse-100 bg-pulse-50 font-display text-xs font-bold text-pulse-600",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon,
  tone = "pulse",
  footer,
}: {
  label: string;
  value: React.ReactNode;
  delta?: { value: string; positive: boolean };
  icon?: React.ReactNode;
  tone?: "pulse" | "jade" | "ember" | "carbon";
  /** Free-form area under the value (progress bars, splits) when a single delta line is not enough. */
  footer?: React.ReactNode;
}) {
  const accent = {
    pulse: "bg-pulse-50 text-pulse-500",
    jade: "bg-jade-50 text-jade-500",
    ember: "bg-ember-50 text-ember-500",
    carbon: "bg-ash-200 text-carbon-700",
  }[tone];

  return (
    <div className="surface relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-bold uppercase tracking-[0.04em] text-carbon-500">{label}</p>
        {icon && (
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", accent)}>
            {icon}
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-3 font-display text-[34px] font-extrabold leading-none tracking-tight",
          tone === "pulse" || tone === "ember" ? "text-pulse-500" : "text-carbon-900",
        )}
      >
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            "mt-2.5 text-xs font-semibold",
            delta.positive ? "text-jade-600" : "text-pulse-600",
          )}
        >
          {delta.value}
        </p>
      )}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  tone = "pulse",
  label,
}: {
  value: number;
  max: number;
  tone?: "pulse" | "jade" | "ember";
  label?: string;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  const fill = {
    pulse: "bg-pulse-500",
    jade: "bg-jade-500",
    ember: "bg-ember-500",
  }[tone];

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-xs text-carbon-500">
          <span>{label}</span>
          <span className="font-display font-bold text-carbon-900">{pct}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-2 overflow-hidden rounded-full bg-ash-300"
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-ash-200", className)} />;
}
