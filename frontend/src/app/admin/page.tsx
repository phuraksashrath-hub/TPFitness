"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CreditCard,
  Dumbbell,
  Lock,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { auditApi, dashboardApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import type { AdminDashboard, AuditLogEntry } from "@/lib/types";
import { formatDate, formatTHB, formatTHBPrecise, relativeFromNow } from "@/lib/format";
import { cn } from "@/lib/cn";
import { LoadChart } from "@/components/portal/load-chart";
import { RevenueChart } from "@/components/portal/revenue-chart";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/card";
import { ProgressBar, Skeleton, StatCard } from "@/components/ui/primitives";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";

const AUDIT_ICONS = {
  ACCESS: ShieldCheck,
  BILLING: CreditCard,
  BOOKING: CalendarClock,
  CLASS: CalendarDays,
  BRANCH: MapPin,
  PEOPLE: Users,
  FACILITY: Wrench,
  PROGRAM: Dumbbell,
  CATALOG: Tag,
  SCHEDULE: Lock,
  LEAD: UserPlus,
} as const;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  TRAINER: "เทรนเนอร์",
  MEMBER: "สมาชิก",
  ANONYMOUS: "ผู้เยี่ยมชม",
};

const clock = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export default function AdminOperationsPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chartTab, setChartTab] = useState<"load" | "revenue">("load");
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const [dashboard, log] = await Promise.all([
        dashboardApi.admin(),
        auditApi.latest(8).catch(() => [] as AuditLogEntry[]),
      ]);
      setData(dashboard);
      setAudit(log);
      setSyncedAt(Date.now());
      setTick(Date.now());
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, "ไม่สามารถโหลดข้อมูลการปฏิบัติการได้"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  if (error) {
    return (
      <EmptyState
        title="ไม่สามารถแสดงข้อมูลได้"
        description={error}
        action={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            ลองอีกครั้ง
          </Button>
        }
      />
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const growth =
    data.revenueLastMonth === 0
      ? null
      : ((data.revenueThisMonth - data.revenueLastMonth) / data.revenueLastMonth) * 100;
  const growthPositive = (growth ?? 0) >= 0;
  const syncedSecondsAgo = syncedAt ? Math.max(0, Math.round((tick - syncedAt) / 1000)) : 0;
  const capacity = data.trainerCapacity;
  const mix = data.paymentMix;

  return (
    <>
      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-center gap-5">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-pulse-500 text-white">
            <Activity className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-carbon-900">
              CONSOLE OPERATIONS
            </h1>
            <p className="mt-1 text-sm text-carbon-500">
              ภาพรวมศูนย์ควบคุมเครือข่าย TP Fitness 24 ชม. ทั่วประเทศ (Cluster TH-BKK-01)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="jade">Cluster Online</Badge>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-full border border-ash-300 px-3.5 py-2 text-xs font-semibold text-carbon-500 transition-colors hover:border-pulse-500 hover:text-pulse-500 focus-pulse"
            >
              <RefreshCw className="size-3.5" /> Sync: {syncedSecondsAgo} วินาทีที่แล้ว
            </button>
            <LinkButton href="/admin/plans" variant="carbon" size="sm">
              <SlidersHorizontal className="size-4" /> ปรับแต่งพารามิเตอร์
            </LinkButton>
            <LinkButton href="/admin/maintenance" size="sm">
              <Wrench className="size-4" /> แจ้งซ่อมอุปกรณ์ใหม่
            </LinkButton>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="สมาชิกที่ใช้งานอยู่"
          value={data.activeSubscriptions}
          icon={<Users className="size-4" />}
          delta={{ value: `สมาชิกทั้งหมด ${data.totalMembers} คน`, positive: true }}
          tone="carbon"
        />
        <StatCard
          label="รายได้เดือนนี้ (MRR)"
          value={formatTHB(data.revenueThisMonth)}
          icon={<Wallet className="size-4" />}
          delta={
            growth === null
              ? undefined
              : {
                  value: `${growthPositive ? "+" : ""}${growth.toFixed(1)}% เทียบเดือนก่อน (MoM)`,
                  positive: growthPositive,
                }
          }
          footer={
            <div className="flex items-center justify-between text-[11px] font-semibold text-carbon-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-pulse-500" /> บัตรเครดิต {mix.creditCardPercent}%
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-carbon-900" /> PromptPay QR {mix.promptPayPercent}%
              </span>
            </div>
          }
        />
        <StatCard
          label="ความจุเทรนเนอร์ (PT)"
          value={`${capacity.percent}%`}
          icon={<Dumbbell className="size-4" />}
          tone="carbon"
          footer={
            <div className="space-y-1.5">
              <ProgressBar value={capacity.bookedSlots} max={Math.max(1, capacity.totalSlots)} />
              <p className="text-[11px] font-semibold text-carbon-500">
                จองแล้ว {capacity.bookedSlots}/{capacity.totalSlots} ชั่วโมง · 7 วันข้างหน้า
              </p>
            </div>
          }
        />
        <StatCard
          label="งานซ่อมบำรุงค้าง"
          value={data.openMaintenanceRequests}
          icon={<AlertTriangle className="size-4" />}
          delta={{
            value: `อุปกรณ์หยุดใช้งาน ${data.equipmentUnderMaintenance} เครื่อง · SLA ISO 9001`,
            positive: data.equipmentUnderMaintenance === 0,
          }}
          tone={data.openMaintenanceRequests > 0 ? "ember" : "pulse"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title={chartTab === "load" ? "กราฟความหนาแน่นการจองรอบ 24 ชั่วโมง" : "กราฟรายได้ย้อนหลัง 6 เดือน"}
            subtitle={
              chartTab === "load"
                ? "จำนวนเซสชัน PT ตามช่วงเวลาของวัน (รวมที่จองไว้และที่เสร็จสิ้นแล้ว)"
                : "ยอดสุทธิที่จัดเก็บได้จริงหลังหักส่วนลด"
            }
            action={
              <div className="inline-flex rounded-full bg-ash-200 p-1 text-xs font-bold">
                {(
                  [
                    ["load", "ความหนาแน่น"],
                    ["revenue", "รายได้"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setChartTab(key)}
                    aria-pressed={chartTab === key}
                    className={`rounded-full px-3.5 py-1.5 transition-colors focus-pulse ${
                      chartTab === key ? "bg-white text-carbon-900 shadow-sm" : "text-carbon-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
          />
          <CardBody>
            {chartTab === "load" ? (
              <LoadChart values={data.hourlyLoad} unit="เซสชัน" />
            ) : (
              <RevenueChart points={data.revenueTrend} />
            )}
            <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-ash-300 pt-5 sm:grid-cols-4">
              {[
                { label: "เดือนนี้", value: formatTHB(data.revenueThisMonth) },
                { label: "เดือนก่อน", value: formatTHB(data.revenueLastMonth) },
                { label: "สมาชิกทั้งหมด", value: data.totalMembers },
                { label: "อุปกรณ์ทั้งหมด", value: data.equipmentTotal },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-carbon-500">
                    {item.label}
                  </dt>
                  <dd className="mt-1 font-display text-lg font-bold text-carbon-900">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="สถานะโซนอุปกรณ์ย่อย"
            subtitle="ความพร้อมใช้งานของอุปกรณ์ในแต่ละพื้นที่ ณ ขณะนี้"
          />
          <CardBody className="space-y-3">
            {data.zones.length === 0 && (
              <p className="text-sm text-carbon-500">ยังไม่มีอุปกรณ์ในทะเบียน</p>
            )}
            {[...data.zones]
              .sort((x, y) => x.available / x.total - y.available / y.total || x.zone.localeCompare(y.zone))
              .slice(0, 4)
              .map((zone) => {
              const pct = zone.total === 0 ? 0 : Math.round((zone.available / zone.total) * 100);
              const healthy = pct === 100;
              return (
                <div key={zone.zone} className="rounded-xl bg-ash-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-bold text-carbon-900">{zone.zone}</p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        healthy ? "bg-jade-50 text-jade-600" : "bg-pulse-50 text-pulse-600"
                      }`}
                    >
                      {healthy ? "พร้อมใช้งาน" : `${pct}% พร้อมใช้งาน`}
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar
                      value={zone.available}
                      max={Math.max(1, zone.total)}
                      tone={healthy ? "jade" : "pulse"}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-carbon-500">
                    พร้อมใช้ {zone.available} จาก {zone.total} เครื่อง
                  </p>
                </div>
              );
            })}
            <Link
              href="/admin/equipment"
              className="block py-2 text-sm font-bold text-pulse-500 hover:text-pulse-600"
            >
              {data.zones.length > 4 ? `ดูทั้งหมด ${data.zones.length} โซน · ` : ""}จัดการทะเบียนอุปกรณ์ →
            </Link>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="คิวงานซ่อมบำรุง"
            subtitle="เรียงตามระดับความเร่งด่วน"
            action={
              <Link
                href="/admin/maintenance"
                className="inline-block py-2 text-sm font-bold text-pulse-500 hover:text-pulse-600"
              >
                เปิดคิวงาน →
              </Link>
            }
          />
          <CardBody className="space-y-2.5">
            {data.latestMaintenance.length === 0 && (
              <p className="text-sm text-carbon-500">ไม่มีงานค้าง อุปกรณ์ทุกชิ้นอยู่ในสภาพดี</p>
            )}
            {data.latestMaintenance.map((request) => (
              <div key={request.id} className="rounded-lg border border-ash-300 bg-ash-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-carbon-900">{request.title}</p>
                    <p className="truncate text-xs text-carbon-500">
                      {request.equipmentName}
                      {request.equipmentLocation ? ` · ${request.equipmentLocation}` : ""}
                    </p>
                  </div>
                  <StatusBadge value={request.priority} />
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-carbon-500">
                  <StatusBadge value={request.status} />
                  <span>แจ้ง {relativeFromNow(request.reportedAt)}</span>
                  <span>โดย {request.reportedByName}</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="ธุรกรรมการชำระเงินล่าสุด"
            action={
              <Link
                href="/admin/plans"
                className="inline-block py-2 text-sm font-bold text-pulse-500 hover:text-pulse-600"
              >
                ดูรายละเอียดรายได้ →
              </Link>
            }
          />
          <CardBody className="space-y-2.5">
            {data.latestPayments.length === 0 && (
              <p className="text-sm text-carbon-500">ยังไม่มีรายการชำระเงิน</p>
            )}
            {data.latestPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-ash-300 bg-ash-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-carbon-900">
                    {payment.memberName}
                  </p>
                  <p className="truncate text-xs text-carbon-500">
                    {payment.planName ?? "แพ็กเกจสมาชิก"} ·{" "}
                    {payment.method === "CREDIT_CARD" ? "บัตรเครดิต" : "PromptPay QR"} ·{" "}
                    {payment.paidAt ? formatDate(payment.paidAt) : "รอชำระเงิน"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold text-carbon-900">
                    {formatTHBPrecise(payment.netAmount)}
                  </p>
                  {payment.discountAmount > 0 && (
                    <p className="text-[11px] font-semibold text-jade-600">
                      −{formatTHB(payment.discountAmount)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader
          title="ระบบตรวจสอบสิทธิ์ (RBAC & Audit)"
          subtitle="บันทึกทุกการกระทำที่เปลี่ยนข้อมูลในระบบ พร้อมผู้ดำเนินการและสิทธิ์ของบัญชีนั้น"
        />
        <CardBody className="space-y-2.5">
          {audit.length === 0 && (
            <p className="text-sm text-carbon-500">ยังไม่มีเหตุการณ์ที่ถูกบันทึก</p>
          )}
          {audit.map((entry) => {
            const denied = entry.outcome === "DENIED";
            const Icon = denied ? ShieldAlert : (AUDIT_ICONS[entry.category] ?? ShieldCheck);
            return (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-4 py-3",
                  denied ? "bg-pulse-50" : "bg-ash-100",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full",
                    denied ? "bg-pulse-500 text-white" : "bg-white text-carbon-700",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-carbon-900">
                    {entry.action}
                    {entry.detail ? <span className="ml-1.5 font-mono text-xs font-semibold text-carbon-500">{entry.detail}</span> : null}
                  </p>
                  <p className="truncate text-xs text-carbon-500">
                    {entry.actorName === ROLE_LABELS[entry.actorRole]
                      ? entry.actorName
                      : `${entry.actorName} · ${ROLE_LABELS[entry.actorRole] ?? entry.actorRole}`}
                  </p>
                </div>
                {denied && <Badge tone="solid">ถูกปฏิเสธ</Badge>}
                <span className="shrink-0 font-mono text-xs text-carbon-500" title={entry.occurredAt}>
                  {clock.format(new Date(entry.occurredAt))}
                </span>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </>
  );
}
