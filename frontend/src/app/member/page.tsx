"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  Flame,
  ShieldCheck,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";
import { dashboardApi, sessionApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import type { MemberDashboard } from "@/lib/types";
import {
  DAY_LABELS,
  formatDate,
  formatTHB,
  formatTime,
  formatWeekday,
  formatWeekdayShort,
  relativeFromNow,
} from "@/lib/format";
import { IdentityBand } from "@/components/portal/portal-shell";
import { TouchlessPass } from "@/components/portal/touchless-pass";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/card";
import { Avatar, ProgressBar, Skeleton, StatCard } from "@/components/ui/primitives";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function MemberOverviewPage() {
  const [data, setData] = useState<MemberDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setData(await dashboardApi.member());
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(id: number) {
    setCancelling(id);
    try {
      await sessionApi.cancel(id, "ยกเลิกจากพอร์ทัลสมาชิก");
      toast.success("ยกเลิกเซสชันแล้ว และคืนเครดิตเข้าแพ็กเกจของคุณเรียบร้อย");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถยกเลิกเซสชันได้"));
    } finally {
      setCancelling(null);
    }
  }

  if (error) {
    return (
      <EmptyState
        title="ไม่สามารถแสดงแดชบอร์ดได้"
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
        <Skeleton className="h-36" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const sub = data.activeSubscription;
  const quota = sub
    ? sub.plan.sessionsPerMonth * Math.max(1, Math.round(sub.plan.durationDays / 30))
    : 0;
  const nextSession = data.upcomingSessions[0];
  const activeProgram = data.programs[0];

  const { weightKg, heightCm, bodyFatPercent, muscleMassKg } = data.metrics;
  const bmi = weightKg && heightCm ? weightKg / Math.pow(heightCm / 100, 2) : null;
  const telemetry = [
    {
      label: "น้ำหนักตัว (Weight)",
      value: weightKg,
      unit: "กก.",
      percent: bmi === null ? 0 : Math.min(100, Math.max(0, ((bmi - 15) / 20) * 100)),
      tone: "bg-pulse-500",
      hint: bmi === null ? "เพิ่มส่วนสูงเพื่อคำนวณ BMI" : `BMI ${bmi.toFixed(1)}`,
    },
    {
      label: "ไขมันในร่างกาย (Fat %)",
      value: bodyFatPercent,
      unit: "%",
      percent: bodyFatPercent === null ? 0 : Math.min(100, (bodyFatPercent / 40) * 100),
      tone: "bg-jade-500",
      hint: bodyFatPercent === null ? "ยังไม่มีข้อมูล" : "ช่วงสุขภาพดีโดยทั่วไป 10–25%",
    },
    {
      label: "มวลกล้ามเนื้อ (SMM)",
      value: muscleMassKg,
      unit: "กก.",
      percent: muscleMassKg && weightKg ? Math.min(100, (muscleMassKg / weightKg) * 100 * 2) : 0,
      tone: "bg-pulse-500",
      hint:
        muscleMassKg && weightKg
          ? `${((muscleMassKg / weightKg) * 100).toFixed(0)}% ของน้ำหนักตัว`
          : "ยังไม่มีข้อมูล",
    },
  ];

  return (
    <>
      <IdentityBand
        avatar={<Avatar name={data.profile.fullName} src={data.profile.avatarUrl} size={72} />}
        badges={
          <>
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wider">
              MEMBER ID: #FP-{data.profile.id.toString().padStart(5, "0")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-jade-600">
              <ShieldCheck className="size-3.5" /> ยืนยันตัวตนแล้ว
            </span>
          </>
        }
        title={data.profile.fullName}
        subtitle={
          sub
            ? `แพ็กเกจ ${sub.plan.name} · หมดอายุ ${formatDate(sub.endDate)}`
            : "ยังไม่มีแพ็กเกจที่ใช้งานอยู่ — เลือกแพ็กเกจเพื่อเริ่มจองเทรนเนอร์"
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[26rem]">
            <div className="rounded-xl bg-white p-4 text-carbon-900">
              <p className="text-[11px] font-bold uppercase tracking-wider text-carbon-500">
                Personal Trainer คงเหลือ
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold text-pulse-500">
                {sub?.remainingSessions ?? 0}
                <span className="ml-1 text-sm font-semibold text-carbon-500">/ {quota} เซสชัน</span>
              </p>
              <Link
                href="/member/booking"
                className="mt-1 inline-flex min-h-10 items-center gap-1 text-xs font-bold text-pulse-500 hover:text-pulse-600"
              >
                จองเทรนเนอร์ <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="rounded-xl bg-white p-4 text-carbon-900">
              <p className="text-[11px] font-bold uppercase tracking-wider text-carbon-500">
                Touchless Club Pass
              </p>
              <p className="mt-1 font-display text-base font-bold">สแกนเข้าคลับ 24 ชม.</p>
              <p className="mt-1 text-xs text-carbon-500">
                {sub?.isUsable ? "สิทธิ์ใช้งานพร้อมแล้ว" : "ต้องมีแพ็กเกจที่ใช้งานอยู่"}
              </p>
            </div>
          </div>
        }
      />

      {nextSession && (
        <Card raised className="mb-6">
          <CardBody className="flex flex-wrap items-center gap-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-pulse-50 text-pulse-500">
              <CalendarClock className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-pulse-500">
                เซสชันถัดไป (Next Session)
              </p>
              <p className="mt-1 font-display text-lg font-bold text-carbon-900">
                {formatWeekday(nextSession.startTime)} · {formatTime(nextSession.startTime)} –{" "}
                {formatTime(nextSession.endTime)} น.
              </p>
              <p className="mt-0.5 text-sm text-carbon-500">
                เทรนเนอร์: {nextSession.trainerName}
                {nextSession.trainerSpecialization ? ` · ${nextSession.trainerSpecialization}` : ""} ·{" "}
                {relativeFromNow(nextSession.startTime)}
              </p>
            </div>
            <div className="flex gap-2">
              <LinkButton href="/member/booking" variant="outline" size="sm">
                เลื่อนเวลา
              </LinkButton>
              <Button
                variant="ghost"
                size="sm"
                loading={cancelling === nextSession.id}
                onClick={() => void cancel(nextSession.id)}
              >
                ยกเลิก
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="เครดิตเซสชัน"
          value={sub ? sub.remainingSessions : "—"}
          delta={sub ? { value: `รวม ${quota} เซสชันในรอบนี้`, positive: true } : undefined}
          icon={<Ticket className="size-4" />}
        />
        <StatCard
          label="วันคงเหลือ"
          value={sub ? sub.daysRemaining : "—"}
          delta={
            sub
              ? { value: `หมดอายุ ${formatDate(sub.endDate)}`, positive: sub.daysRemaining > 7 }
              : undefined
          }
          icon={<CalendarClock className="size-4" />}
          tone={sub && sub.daysRemaining <= 7 ? "ember" : "pulse"}
        />
        <StatCard
          label="เซสชันที่ฝึกจบแล้ว"
          value={data.sessionsCompleted}
          icon={<CheckCircle2 className="size-4" />}
          tone="jade"
        />
        <StatCard
          label="นัดหมายที่กำลังจะถึง"
          value={data.sessionsUpcoming}
          icon={<Flame className="size-4" />}
          tone="carbon"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[22rem_1fr]">
        <TouchlessPass
          memberId={data.profile.id}
          memberName={data.profile.fullName}
          lockerCode={sub ? `#B-${(data.profile.id % 90) + 10}` : null}
        />

        <div className="space-y-6">
          {/* ---------- Body telemetry ---------- */}
          <Card>
            <CardHeader
              title="Body Telemetry Tracking"
              subtitle="ข้อมูลองค์ประกอบร่างกายล่าสุดที่คุณบันทึกไว้"
              action={
                data.metrics.fitnessGoal ? (
                  <span className="hidden max-w-[16rem] truncate rounded-full bg-ash-200 px-3 py-1 text-xs font-semibold text-carbon-700 sm:block">
                    เป้าหมาย: {data.metrics.fitnessGoal}
                  </span>
                ) : undefined
              }
            />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-3">
                {telemetry.map((item) => (
                  <div key={item.label} className="rounded-xl bg-ash-100 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-carbon-500">
                      {item.label}
                    </p>
                    <p className="mt-2 font-display text-[32px] font-extrabold leading-none tracking-tight text-carbon-900">
                      {item.value === null ? "—" : item.value}
                      <span className="ml-1 text-sm font-semibold text-carbon-500">{item.unit}</span>
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ash-300">
                      <div
                        className={`h-full rounded-full ${item.tone}`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-carbon-500">{item.hint}</p>
                  </div>
                ))}
              </div>
              {telemetry.every((t) => t.value === null) && (
                <p className="mt-4 text-sm text-carbon-500">
                  ยังไม่มีข้อมูล ·{" "}
                  <Link href="/member/profile" className="font-bold text-pulse-500 hover:text-pulse-600">
                    บันทึกข้อมูลร่างกาย →
                  </Link>
                </p>
              )}
            </CardBody>
          </Card>

          {/* ---------- Weekly program ---------- */}
          <Card>
            <CardHeader
              title="ตารางฝึกซ้อมประจำสัปดาห์"
              subtitle={
                activeProgram
                  ? `${activeProgram.title} · โดย ${activeProgram.trainerName}`
                  : "ยังไม่มีโปรแกรมที่เทรนเนอร์กำหนดให้"
              }
              action={
                <Link
                  href="/member/programs"
                  className="inline-block py-2 text-sm font-bold text-pulse-500 hover:text-pulse-600"
                >
                  ดูทั้งหมด →
                </Link>
              }
            />
            <CardBody>
              {!activeProgram ? (
                <p className="text-sm text-carbon-500">
                  หลังเทรนครั้งแรก เทรนเนอร์จะเผยแพร่โปรแกรมฝึกแบบสัปดาห์ต่อสัปดาห์ให้คุณที่นี่
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {DAY_LABELS.map((label, index) => {
                    const exercises = activeProgram.exercises.filter(
                      (e) => e.dayOfWeek === index + 1,
                    );
                    if (exercises.length === 0) return null;
                    return (
                      <div
                        key={label}
                        className="rounded-xl border border-ash-300 bg-ash-50 p-4 transition-colors hover:border-pulse-500"
                      >
                        <p className="text-[11px] font-bold uppercase tracking-wider text-carbon-500">
                          {label}
                        </p>
                        <p className="mt-1 font-display text-base font-bold text-carbon-900">
                          {exercises[0].name}
                        </p>
                        <p className="mt-1.5 text-xs text-carbon-500">
                          {exercises.length} ท่า · {exercises.reduce((sum, e) => sum + e.sets, 0)}{" "}
                          เซตรวม
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* ---------- Upcoming sessions ---------- */}
          <Card>
            <CardHeader
              title="นัดหมายที่กำลังจะถึง"
              subtitle="ยกเลิกล่วงหน้าอย่างน้อย 2 ชั่วโมงเพื่อรับเครดิตคืน"
              action={
                <LinkButton href="/member/booking" variant="ghost" size="sm">
                  <CalendarPlus className="size-4" /> จองเพิ่ม
                </LinkButton>
              }
            />
            <CardBody className="space-y-3">
              {data.upcomingSessions.length === 0 && (
                <EmptyState
                  icon={<CalendarClock className="size-7" />}
                  title="ยังไม่มีนัดหมาย"
                  description="เลือกเทรนเนอร์และช่วงเวลาที่ต้องการ ระบบจะแสดงเฉพาะช่วงที่ว่างจริงเท่านั้น"
                  action={
                    <LinkButton href="/member/booking" size="sm" className="mt-2">
                      ค้นหาเวลาว่าง
                    </LinkButton>
                  }
                />
              )}

              {data.upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-ash-300 bg-ash-50 p-4 transition-colors hover:border-pulse-500"
                >
                  <div className="flex min-w-24 flex-col items-center rounded-lg bg-pulse-500 px-3 py-2 text-white">
                    <span className="font-display text-lg font-extrabold">
                      {formatTime(session.startTime)}
                    </span>
                    <span className="text-[11px] tracking-wider">
                      {formatWeekdayShort(session.startTime)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-bold text-carbon-900">
                      {session.trainerName}
                    </p>
                    <p className="truncate text-sm text-carbon-500">
                      {session.trainerSpecialization ?? "เทรนเนอร์ส่วนตัว"} ·{" "}
                      {formatWeekday(session.startTime)}
                    </p>
                    <p className="mt-1 text-xs text-carbon-500">
                      {relativeFromNow(session.startTime)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge value={session.status} />
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={cancelling === session.id}
                      onClick={() => void cancel(session.id)}
                      aria-label={`ยกเลิกเซสชันกับ ${session.trainerName}`}
                    >
                      <X className="size-3.5" /> ยกเลิก
                    </Button>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ---------- Membership + payments ---------- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="สถานะแพ็กเกจสมาชิก"
            subtitle="ส่วนลดคำนวณจาก strategy engine ฝั่งเซิร์ฟเวอร์เสมอ"
            action={sub ? <StatusBadge value={sub.status} /> : <Badge tone="ash">ไม่มีแพ็กเกจ</Badge>}
          />
          <CardBody className="space-y-5">
            {sub ? (
              <>
                <p className="font-display text-2xl font-extrabold text-carbon-900">
                  {sub.plan.name}
                </p>
                <ProgressBar
                  value={sub.remainingSessions}
                  max={quota}
                  label="เครดิตคงเหลือ"
                  tone={sub.remainingSessions === 0 ? "ember" : "pulse"}
                />
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-carbon-500">เริ่มใช้งาน</dt>
                    <dd className="mt-1 font-semibold text-carbon-900">
                      {formatDate(sub.startDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-carbon-500">หมดอายุ</dt>
                    <dd className="mt-1 font-semibold text-carbon-900">{formatDate(sub.endDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-carbon-500">ต่ออายุอัตโนมัติ</dt>
                    <dd className="mt-1 font-semibold text-carbon-900">
                      {sub.autoRenew ? "เปิดใช้งาน" : "ปิดอยู่"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-carbon-500">ราคาแพ็กเกจ</dt>
                    <dd className="mt-1 font-semibold text-carbon-900">
                      {formatTHB(sub.plan.price)}
                    </dd>
                  </div>
                </dl>
                <LinkButton href="/member/membership" variant="outline" className="w-full">
                  <CreditCard className="size-4" /> ต่ออายุหรืออัปเกรดแพ็กเกจ
                </LinkButton>
              </>
            ) : (
              <>
                <p className="text-sm text-carbon-500">
                  เปิดใช้งานแพ็กเกจเพื่อปลดล็อกการจองเทรนเนอร์และห้องฟื้นฟูร่างกาย
                </p>
                <LinkButton href="/member/membership" className="w-full">
                  <Sparkles className="size-4" /> เลือกแพ็กเกจ
                </LinkButton>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="ประวัติการชำระเงินล่าสุด" />
          <CardBody className="space-y-2.5">
            {data.recentPayments.length === 0 && (
              <p className="text-sm text-carbon-500">ยังไม่มีรายการชำระเงิน</p>
            )}
            {data.recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-ash-300 bg-ash-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-carbon-900">
                    {payment.planName ?? payment.transactionReference}
                  </p>
                  <p className="text-xs text-carbon-500">
                    {payment.method === "CREDIT_CARD" ? "บัตรเครดิต" : "PromptPay QR"} ·{" "}
                    {payment.paidAt ? formatDate(payment.paidAt) : "รอชำระเงิน"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold text-carbon-900">
                    {formatTHB(payment.netAmount)}
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

      {/* ---------- Programs ---------- */}
      <Card className="mt-6">
        <CardHeader
          title="โปรแกรมฝึกที่ใช้งานอยู่"
          subtitle="เขียนโดยเทรนเนอร์ของคุณผ่านระบบ TP Fitness"
          action={
            <Link
              href="/member/programs"
              className="inline-block py-2 text-sm font-bold text-pulse-500 hover:text-pulse-600"
            >
              ดูทั้งหมด →
            </Link>
          }
        />
        <CardBody className="grid gap-4 md:grid-cols-2">
          {data.programs.length === 0 && (
            <p className="text-sm text-carbon-500">
              ยังไม่มีโปรแกรมที่กำหนดให้ จองเซสชันแรกแล้วเทรนเนอร์จะออกแบบให้คุณ
            </p>
          )}
          {data.programs.slice(0, 2).map((program) => (
            <div key={program.id} className="rounded-xl border border-ash-300 bg-ash-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-bold text-carbon-900">{program.title}</p>
                  <p className="mt-1 text-sm text-carbon-500">{program.goal}</p>
                </div>
                <StatusBadge value={program.difficulty} />
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-ash-300 pt-4">
                <Avatar name={program.trainerName} size={32} />
                <div className="text-xs text-carbon-500">
                  <p className="font-semibold text-carbon-900">{program.trainerName}</p>
                  <p>
                    {program.durationWeeks} สัปดาห์ · {program.exercises.length} ท่าฝึก
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
      {/* ---------- Plan privileges ---------- */}
      {sub && sub.plan.perks.length > 0 && (
        <section className="kinetic-grid relative mt-6 overflow-hidden rounded-2xl bg-carbon-900 px-6 py-8 text-white sm:px-9">
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-block rounded-full bg-pulse-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]">
                Exclusive privilege
              </span>
              <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                สิทธิพิเศษสำหรับสมาชิกแพ็กเกจ {sub.plan.name}
              </h2>
              <p className="mt-2 text-sm text-ash-500">{sub.plan.perks.slice(0, 4).join(" · ")}</p>
            </div>
            <LinkButton href="/member/membership" className="!bg-white !text-carbon-900 hover:!bg-ash-200 shrink-0">
              ดูสิทธิประโยชน์สมาชิก <ArrowRight className="size-4" />
            </LinkButton>
          </div>
        </section>
      )}
    </>
  );
}
