"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, Download, Star, Users } from "lucide-react";
import { dashboardApi, sessionApi, trainerApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import type { Trainer, TrainerDashboard } from "@/lib/types";
import { formatTHB, formatTime, formatWeekday, relativeFromNow } from "@/lib/format";
import { IdentityBand } from "@/components/portal/portal-shell";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/card";
import { Avatar, Skeleton, StatCard } from "@/components/ui/primitives";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export default function TrainerTodayPage() {
  const toast = useToast();
  const [data, setData] = useState<TrainerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [expertise, setExpertise] = useState<Trainer | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await dashboardApi.trainer());
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, "ไม่สามารถโหลดตารางสอนได้"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // The dashboard payload carries the account only; specialisation and certifications live on the trainer card.
  const trainerId = data?.profile.id;
  useEffect(() => {
    if (trainerId === undefined) return;
    trainerApi.byId(trainerId).then(setExpertise).catch(() => setExpertise(null));
  }, [trainerId]);

  async function completeSession() {
    if (closing === null) return;
    setSaving(true);
    try {
      await sessionApi.complete(closing, notes.trim() || undefined);
      toast.success("ปิดเซสชันเรียบร้อยแล้ว");
      setClosing(null);
      setNotes("");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถปิดเซสชันได้"));
    } finally {
      setSaving(false);
    }
  }

  function exportLedger() {
    if (!data) return;
    const rows = [...data.todaySchedule, ...data.upcomingSessions];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      ["สมาชิก", "วันที่", "เวลาเริ่ม", "เวลาสิ้นสุด", "สถานะ"].map(escape).join(","),
      ...rows.map((r) =>
        [
          r.memberName,
          formatWeekday(r.startTime),
          formatTime(r.startTime),
          formatTime(r.endTime),
          r.status,
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\r\n");
    // BOM so Excel opens the Thai text as UTF-8.
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `tp-fitness-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (error) {
    return (
      <EmptyState
        title="ไม่สามารถแสดงตารางสอนได้"
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

  const nextSession = data.todaySchedule.find((s) => s.status === "BOOKED");
  const certifications = (expertise?.certifications ?? "")
    .split(/[,;\n]/)
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <>
      <IdentityBand
        avatar={<Avatar name={data.profile.fullName} src={data.profile.avatarUrl} size={72} />}
        badges={
          <>
            {expertise?.specialization && (
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pulse-600">
                {expertise.specialization}
              </span>
            )}
            {certifications.map((cert) => (
              <span key={cert} className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wider">
                {cert}
              </span>
            ))}
            {expertise && expertise.yearsOfExperience > 0 && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wider">
                ประสบการณ์ {expertise.yearsOfExperience} ปี
              </span>
            )}
          </>
        }
        title={`โค้ช ${data.profile.fullName}`}
        subtitle="TP Fitness · Personal Trainer Portal"
        aside={
          <div className="grid grid-cols-3 gap-3 lg:w-[26rem]">
            <div className="rounded-xl bg-white p-4 text-carbon-900">
              <p className="font-display text-2xl font-extrabold text-pulse-500">
                {data.sessionsCompletedThisMonth}
                <span className="text-sm font-semibold text-carbon-500"> / {data.monthlySessionTarget}</span>
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ash-300">
                <div
                  className="h-full rounded-full bg-pulse-500"
                  style={{
                    width: `${Math.min(100, (data.sessionsCompletedThisMonth / Math.max(1, data.monthlySessionTarget)) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-[11px] leading-tight text-carbon-500">เป้าหมายเดือนนี้ (เซสชัน PT)</p>
            </div>
            {[
              { label: "เซสชันสัปดาห์นี้", value: data.sessionsThisWeek },
              { label: "สมาชิกดูแล", value: data.activeClients },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-white p-4 text-carbon-900">
                <p className="font-display text-2xl font-extrabold text-pulse-500">{item.value}</p>
                <p className="mt-1 text-[11px] leading-tight text-carbon-500">{item.label}</p>
              </div>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="เซสชันวันนี้"
          value={data.sessionsToday}
          icon={<Clock className="size-4" />}
        />
        <StatCard
          label="เซสชันสัปดาห์นี้"
          value={data.sessionsThisWeek}
          icon={<CalendarDays className="size-4" />}
          tone="carbon"
        />
        <StatCard
          label="สมาชิกในความดูแล"
          value={data.activeClients}
          icon={<Users className="size-4" />}
          tone="jade"
        />
        <StatCard
          label="คะแนนเฉลี่ย"
          value={data.ratingAverage.toFixed(2)}
          icon={<Star className="size-4" />}
          delta={{ value: "จากความเห็นของสมาชิก", positive: true }}
        />
      </div>

      {nextSession && (
        <Card raised className="mt-6 overflow-hidden">
          <div className="flex flex-wrap items-center gap-6 p-6">
            <div className="flex min-w-32 flex-col items-center rounded-xl bg-pulse-500 px-5 py-4 text-white">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em]">คิวถัดไป</span>
              <span className="mt-1 font-display text-3xl font-extrabold">
                {formatTime(nextSession.startTime)}
              </span>
              <span className="text-xs text-white/80">{relativeFromNow(nextSession.startTime)}</span>
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Avatar name={nextSession.memberName} src={nextSession.memberAvatarUrl} size={52} />
              <div className="min-w-0">
                <p className="font-display text-xl font-extrabold text-carbon-900">
                  {nextSession.memberName}
                </p>
                <p className="text-sm text-carbon-500">
                  {formatTime(nextSession.startTime)} – {formatTime(nextSession.endTime)} น.
                </p>
                {nextSession.notes && (
                  <p className="mt-1.5 rounded-lg border border-ash-300 bg-ash-50 px-3 py-1.5 text-xs text-carbon-700">
                    “{nextSession.notes}”
                  </p>
                )}
              </div>
            </div>

            <Button onClick={() => setClosing(nextSession.id)}>
              <CheckCircle2 className="size-4" /> เช็คอิน / ปิดเซสชัน
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title="ตารางสอนวันนี้"
            subtitle={formatWeekday(new Date().toISOString())}
            action={
              <Link
                href="/trainer/schedule"
                className="inline-block py-2 text-sm font-bold text-pulse-500 hover:text-pulse-600"
              >
                ดูตารางเต็ม →
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {data.todaySchedule.length === 0 && (
              <EmptyState
                icon={<CalendarDays className="size-7" />}
                title="วันนี้ไม่มีเซสชัน"
                description="พักผ่อนให้เต็มที่ หรือเปิดช่วงเวลาว่างเพิ่มเพื่อรับการจอง"
              />
            )}

            {data.todaySchedule.map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-ash-300 bg-ash-50 p-4"
              >
                <span className="font-display text-sm font-extrabold text-pulse-500">
                  {formatTime(session.startTime)}
                </span>
                <Avatar name={session.memberName} src={session.memberAvatarUrl} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-carbon-900">{session.memberName}</p>
                  <p className="truncate text-xs text-carbon-500">
                    {formatTime(session.startTime)} – {formatTime(session.endTime)} น.
                    {session.notes ? ` · ${session.notes}` : ""}
                  </p>
                </div>
                <StatusBadge value={session.status} />
                {session.status === "BOOKED" && (
                  <Button variant="outline" size="sm" onClick={() => setClosing(session.id)}>
                    เช็กอิน (-1)
                  </Button>
                )}
              </div>
            ))}
          </CardBody>
        </Card>

        {/* ---------- Session verification ledger ---------- */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 bg-carbon-900 px-6 py-4 text-white">
            <p className="font-display text-sm font-bold tracking-tight">
              SESSION VERIFICATION LEDGER
            </p>
            <Badge tone="jade">หักเครดิตตอนจอง</Badge>
          </div>
          <CardBody className="space-y-2.5">
            {data.upcomingSessions.length === 0 && (
              <p className="text-sm text-carbon-500">ไม่มีนัดหมายอื่นในสัปดาห์นี้</p>
            )}
            {data.upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 rounded-lg border border-ash-300 bg-ash-50 px-3.5 py-3"
              >
                <Avatar name={session.memberName} src={session.memberAvatarUrl} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-carbon-900">
                    {session.memberName}
                  </p>
                  <p className="text-xs text-carbon-500">
                    {formatWeekday(session.startTime)} · {formatTime(session.startTime)} น.
                  </p>
                </div>
                <StatusBadge value={session.status} />
              </div>
            ))}
          </CardBody>
          <div className="flex items-center justify-between gap-3 border-t border-ash-300 bg-ash-100 px-6 py-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-carbon-500">
                ยอดสะสมค่าสอนเดือนนี้
              </p>
              <p className="font-display text-xl font-extrabold text-pulse-500">
                {formatTHB(data.earningsThisMonth)}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={exportLedger}>
              <Download className="size-4" /> ส่งออกรายงาน
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        open={closing !== null}
        onClose={() => setClosing(null)}
        title="ปิดเซสชันการฝึก"
        description="บันทึกสั้น ๆ เพื่อเก็บไว้ในประวัติของสมาชิก"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setClosing(null)}>
              ยกเลิก
            </Button>
            <Button loading={saving} onClick={() => void completeSession()}>
              ยืนยันการฝึกเสร็จสิ้น
            </Button>
          </>
        }
      >
        <Textarea
          label="Coaching cues & บันทึกประจำเซสชัน"
          placeholder="ทำได้ 3×5 ที่ 70 กก. สัปดาห์หน้าเพิ่ม 2.5 กก. เข่าซ้ายไม่มีอาการ"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Modal>
    </>
  );
}
