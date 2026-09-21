import { cn } from "@/lib/cn";

export type BadgeTone = "pulse" | "jade" | "ember" | "ash" | "glow" | "carbon" | "solid";

const tones: Record<BadgeTone, string> = {
  pulse: "bg-pulse-50 text-pulse-600 border-pulse-100",
  jade: "bg-jade-50 text-jade-600 border-jade-400/30",
  ember: "bg-ember-50 text-ember-600 border-ember-500/25",
  ash: "bg-ash-200 text-carbon-500 border-ash-300",
  glow: "bg-glow-50 text-glow-500 border-glow-500/25",
  carbon: "bg-carbon-900 text-white border-carbon-900",
  solid: "bg-pulse-500 text-white border-pulse-500",
};

export function Badge({
  tone = "ash",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusTones: Record<string, BadgeTone> = {
  ACTIVE: "jade",
  AVAILABLE: "jade",
  PAID: "jade",
  COMPLETED: "jade",
  RESOLVED: "jade",
  BOOKED: "pulse",
  IN_USE: "pulse",
  PENDING: "glow",
  PENDING_PAYMENT: "glow",
  IN_PROGRESS: "glow",
  OPEN: "glow",
  UNDER_MAINTENANCE: "ember",
  CANCELLED: "ember",
  EXPIRED: "ember",
  FAILED: "ember",
  NO_SHOW: "ember",
  SUSPENDED: "ember",
  CRITICAL: "solid",
  HIGH: "ember",
  MEDIUM: "glow",
  LOW: "ash",
  REJECTED: "ash",
  RETIRED: "ash",
  INACTIVE: "ash",
  REFUNDED: "ash",
  STANDARD: "ash",
  PREMIUM: "pulse",
  ELITE: "carbon",
  BEGINNER: "ash",
  INTERMEDIATE: "glow",
  ADVANCED: "pulse",
};

/** Thai labels so status chips read naturally alongside the rest of the portal copy. */
export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "ใช้งานอยู่",
  NEW: "ใหม่",
  CONTACTED: "ติดต่อแล้ว",
  INACTIVE: "ไม่ใช้งาน",
  SUSPENDED: "ระงับสิทธิ์",
  EXPIRED: "หมดอายุ",
  CANCELLED: "ยกเลิกแล้ว",
  PENDING_PAYMENT: "รอชำระเงิน",
  BOOKED: "จองแล้ว",
  COMPLETED: "เสร็จสิ้น",
  NO_SHOW: "ไม่มาตามนัด",
  PENDING: "รอดำเนินการ",
  PAID: "ชำระแล้ว",
  FAILED: "ไม่สำเร็จ",
  REFUNDED: "คืนเงินแล้ว",
  AVAILABLE: "พร้อมใช้งาน",
  IN_USE: "กำลังใช้งาน",
  UNDER_MAINTENANCE: "อยู่ระหว่างซ่อมบำรุง",
  RETIRED: "ปลดระวาง",
  OPEN: "รอตรวจสอบ",
  IN_PROGRESS: "กำลังดำเนินการ",
  RESOLVED: "ซ่อมเสร็จแล้ว",
  REJECTED: "ปฏิเสธ",
  LOW: "ต่ำ",
  MEDIUM: "ปานกลาง",
  HIGH: "สูง",
  CRITICAL: "ด่วนที่สุด",
  BEGINNER: "เริ่มต้น",
  INTERMEDIATE: "ปานกลาง",
  ADVANCED: "ขั้นสูง",
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <Badge tone={statusTones[value] ?? "ash"} className={className}>
      {STATUS_LABELS[value] ?? value.replace(/_/g, " ")}
    </Badge>
  );
}

