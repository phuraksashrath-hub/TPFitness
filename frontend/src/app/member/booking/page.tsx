"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck2, ChevronLeft, ChevronRight, Clock, Star, Ticket } from "lucide-react";
import { sessionApi, subscriptionApi, trainerApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import type { Subscription, TimeSlot, Trainer, WorkoutSession } from "@/lib/types";
import {
  addDays,
  formatDate,
  formatTHB,
  formatTime,
  formatWeekday,
  formatWeekdayShort,
  startOfUtcDay,
  toDateKey,
} from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/card";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const DURATIONS = [45, 60, 90];

export default function SmartBookingPage() {
  const toast = useToast();

  const [trainers, setTrainers] = useState<Trainer[] | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  const [trainerId, setTrainerId] = useState<number | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => startOfUtcDay(addDays(new Date(), 1)));
  const [duration, setDuration] = useState(60);

  const [slots, setSlots] = useState<TimeSlot[] | null>(null);
  const [pendingSlot, setPendingSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<WorkoutSession | null>(null);

  const week = useMemo(() => {
    const start = startOfUtcDay(addDays(new Date(), 1 + weekOffset * 7));
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekOffset]);

  const loadSessions = useCallback(async () => {
    try {
      setSessions(await sessionApi.mine());
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถโหลดรายการเซสชันของคุณได้"));
    }
  }, [toast]);

  useEffect(() => {
    trainerApi
      .list()
      .then((list) => {
        setTrainers(list);
        setTrainerId((current) => current ?? list[0]?.id ?? null);
      })
      .catch(() => setTrainers([]));

    subscriptionApi.active().then(setSubscription).catch(() => setSubscription(null));
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!trainerId) return;
    setSlots(null);
    sessionApi
      .availability(trainerId, toDateKey(selectedDate), duration)
      .then((res) => setSlots(res.slots))
      .catch((err) => {
        setSlots([]);
        toast.error(apiErrorMessage(err, "ไม่สามารถโหลดช่วงเวลาว่างได้"));
      });
  }, [trainerId, selectedDate, duration, toast]);

  const selectedTrainer = trainers?.find((t) => t.id === trainerId) ?? null;
  const upcoming = sessions
    .filter((s) => s.status === "BOOKED" && new Date(s.startTime) > new Date())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  async function confirmBooking() {
    if (!pendingSlot || !trainerId) return;
    setBooking(true);
    try {
      if (rescheduleTarget) {
        await sessionApi.reschedule(rescheduleTarget.id, pendingSlot.startTime, duration);
        toast.success("เลื่อนเซสชันไปยังช่วงเวลาใหม่เรียบร้อยแล้ว");
      } else {
        await sessionApi.book({
          trainerId,
          startTime: pendingSlot.startTime,
          durationMinutes: duration,
          notes: notes.trim() || undefined,
        });
        toast.success("ยืนยันการนัดหมายแล้ว ระบบได้หักเครดิต 1 เซสชันจากแพ็กเกจของคุณ");
      }

      setPendingSlot(null);
      setRescheduleTarget(null);
      setNotes("");
      await Promise.all([
        loadSessions(),
        subscriptionApi.active().then(setSubscription).catch(() => undefined),
        sessionApi.availability(trainerId, toDateKey(selectedDate), duration).then((r) => setSlots(r.slots)),
      ]);
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถยืนยันการจองได้"));
    } finally {
      setBooking(false);
    }
  }

  async function cancelSession(session: WorkoutSession) {
    try {
      await sessionApi.cancel(session.id, "ยกเลิกจากหน้าจองเซสชัน");
      toast.success("ยกเลิกเซสชันแล้ว และคืนเครดิตเข้าแพ็กเกจเรียบร้อย");
      await Promise.all([
        loadSessions(),
        subscriptionApi.active().then(setSubscription).catch(() => undefined),
      ]);
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถยกเลิกเซสชันได้"));
    }
  }

  const canBook = Boolean(subscription?.isUsable && (subscription?.remainingSessions ?? 0) > 0);

  return (
    <>
      <PageHeading
        eyebrow="Real-time booking engine"
        title="จองเซสชันผู้ฝึกสอนส่วนตัว (PT Booking)"
        description="ระบบป้องกันการจองชนกัน (Conflict Prevention) และแสดงสถานะว่างแบบเรียลไทม์"
        action={
          <div className="flex items-center gap-2 rounded-full bg-pulse-500 px-4 py-2 text-white">
            <Ticket className="size-4" />
            <span className="text-sm">
              คงเหลือ{" "}
              <span className="font-display font-extrabold">
                {subscription?.remainingSessions ?? 0}
              </span>{" "}
              เซสชัน
            </span>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-5 text-xs font-semibold text-carbon-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-jade-500" /> เวลาว่าง (Available)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-pulse-500" /> รอบที่คุณเลือก
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-ash-400" /> ไม่ว่าง (Booked)
        </span>
      </div>

      {!canBook && (
        <div className="mb-6 rounded-xl border border-glow-500/30 bg-glow-50 px-5 py-4 text-sm font-medium text-glow-500">
          {subscription
            ? "เครดิตเซสชันของแพ็กเกจนี้หมดแล้ว กรุณาต่ออายุหรืออัปเกรดเพื่อจองต่อ"
            : "คุณต้องมีแพ็กเกจสมาชิกที่ใช้งานอยู่ก่อนจึงจะจองเทรนเนอร์ได้"}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        {/* ---------- Coach picker ---------- */}
        <Card className="h-fit">
          <CardHeader
            title="1. เลือกผู้ฝึกสอนส่วนตัว"
            subtitle="เทรนเนอร์ทุกคนได้รับการรับรอง ACE & NASM"
          />
          <CardBody className="space-y-2.5">
            {!trainers && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}

            {trainers?.map((trainer) => (
              <button
                key={trainer.id}
                type="button"
                onClick={() => setTrainerId(trainer.id)}
                aria-pressed={trainerId === trainer.id}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all focus-pulse",
                  trainerId === trainer.id
                    ? "border-pulse-500 bg-pulse-50 shadow-pulse"
                    : "border-ash-300 bg-white hover:border-ash-500",
                )}
              >
                <Avatar name={trainer.fullName} src={trainer.avatarUrl} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-xs font-bold text-pulse-500">
                    <Star className="size-3 fill-current" /> {trainer.ratingAverage.toFixed(2)}
                    <span className="font-normal text-carbon-500">({trainer.ratingCount})</span>
                  </p>
                  <p className="truncate font-display text-sm font-bold text-carbon-900">
                    {trainer.fullName}
                  </p>
                  <p className="truncate text-xs text-carbon-500">
                    {trainer.specialization} · {formatTHB(trainer.hourlyRate)}/ชม.
                  </p>
                </div>
              </button>
            ))}
          </CardBody>
        </Card>

        {/* ---------- Calendar + slots ---------- */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title={
                selectedTrainer
                  ? `2. เลือกวันฝึกซ้อมกับ ${selectedTrainer.fullName}`
                  : "2. เลือกวันฝึกซ้อม"
              }
              subtitle={formatWeekday(selectedDate.toISOString())}
              action={
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="สัปดาห์ก่อนหน้า"
                    disabled={weekOffset === 0}
                    onClick={() => setWeekOffset((v) => Math.max(0, v - 1))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="สัปดาห์ถัดไป"
                    onClick={() => setWeekOffset((v) => v + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              }
            />
            <CardBody className="space-y-6">
              <div className="grid grid-cols-7 gap-2">
                {week.map((day) => {
                  const key = toDateKey(day);
                  const active = key === toDateKey(selectedDate);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      aria-pressed={active}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border px-1 py-3 transition-all focus-pulse",
                        active
                          ? "border-pulse-500 bg-pulse-500 text-white"
                          : "border-ash-300 bg-white text-carbon-500 hover:border-ash-500",
                      )}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider">
                        {formatWeekdayShort(day.toISOString())}
                      </span>
                      <span className="font-display text-lg font-extrabold">{day.getUTCDate()}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-carbon-500">
                  ระยะเวลา
                </span>
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    aria-pressed={duration === d}
                    className={cn(
                      "min-h-10 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors focus-pulse",
                      duration === d
                        ? "border-pulse-500 bg-pulse-50 text-pulse-600"
                        : "border-ash-300 text-carbon-500 hover:border-ash-500",
                    )}
                  >
                    {d} นาที
                  </button>
                ))}
              </div>

              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-carbon-500">
                  3. เลือกรอบเวลาที่ต้องการ · {formatDate(selectedDate.toISOString())} (UTC)
                </p>

                {!slots && (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {Array.from({ length: 8 }, (_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                )}

                {slots && slots.every((s) => !s.isAvailable) && (
                  <EmptyState
                    icon={<Clock className="size-7" />}
                    title="รอบนี้เต็มแล้ว"
                    description="ลองเลือกวันอื่นหรือเปลี่ยนเทรนเนอร์"
                  />
                )}

                {slots && slots.some((s) => s.isAvailable) && (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {slots.map((slot) => {
                      const selected = pendingSlot?.startTime === slot.startTime;
                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          disabled={!slot.isAvailable || !canBook}
                          onClick={() => setPendingSlot(slot)}
                          className={cn(
                            "rounded-xl border px-3 py-3 text-center transition-all focus-pulse",
                            !slot.isAvailable || !canBook
                              ? "cursor-not-allowed border-ash-200 bg-ash-100 text-ash-600 line-through"
                              : selected
                                ? "border-pulse-500 bg-pulse-500 text-white shadow-pulse"
                                : "border-jade-400/40 bg-jade-50 text-jade-600 hover:border-pulse-500 hover:bg-pulse-50 hover:text-pulse-600",
                          )}
                        >
                          <span className="font-display text-sm font-bold">
                            {formatTime(slot.startTime)}
                          </span>
                          <span className="block text-[11px] opacity-80">
                            {slot.isAvailable ? `→ ${formatTime(slot.endTime)}` : "จองแล้ว"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* ---------- Existing bookings ---------- */}
          <Card>
            <CardHeader
              title="เซสชันที่คุณจองไว้"
              subtitle="เลื่อนเวลาหรือยกเลิกได้ในคลิกเดียว"
            />
            <CardBody className="space-y-3">
              {upcoming.length === 0 && (
                <p className="text-sm text-carbon-500">ยังไม่มีการจอง</p>
              )}
              {upcoming.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-ash-300 bg-ash-50 p-4"
                >
                  <Avatar name={session.trainerName} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-carbon-900">{session.trainerName}</p>
                    <p className="text-xs text-carbon-500">
                      {formatWeekday(session.startTime)} · {formatTime(session.startTime)}–
                      {formatTime(session.endTime)} น.
                    </p>
                  </div>
                  <StatusBadge value={session.status} />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRescheduleTarget(session);
                        setTrainerId(session.trainerId);
                        toast.push("เลือกช่วงเวลาใหม่ด้านบน แล้วกดยืนยัน");
                      }}
                    >
                      เลื่อนเวลา
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => void cancelSession(session)}>
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={Boolean(pendingSlot)}
        onClose={() => {
          setPendingSlot(null);
          setRescheduleTarget(null);
        }}
        title={rescheduleTarget ? "เลื่อนเซสชันนี้" : "ยืนยันการนัดหมาย"}
        description={selectedTrainer ? `โค้ชประจำตัว: ${selectedTrainer.fullName}` : undefined}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setPendingSlot(null);
                setRescheduleTarget(null);
              }}
            >
              ย้อนกลับ
            </Button>
            <Button loading={booking} onClick={() => void confirmBooking()}>
              <CalendarCheck2 className="size-4" />
              {rescheduleTarget ? "ยืนยันการเลื่อน" : "ยืนยันการนัดหมาย"}
            </Button>
          </>
        }
      >
        {pendingSlot && (
          <div className="space-y-5">
            <div className="rounded-xl bg-pulse-500 p-4 text-white">
              <p className="font-display text-lg font-extrabold">
                {formatTime(pendingSlot.startTime)} – {formatTime(pendingSlot.endTime)} น.
              </p>
              <p className="mt-1 text-sm text-white/85">
                {formatWeekday(pendingSlot.startTime)}
              </p>
            </div>

            {!rescheduleTarget && (
              <>
                <Textarea
                  label="บันทึกถึงเทรนเนอร์"
                  placeholder="มีอาการบาดเจ็บ จุดที่อยากเน้น หรือเป้าหมายพิเศษไหม?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex items-center justify-between rounded-lg border border-ash-300 bg-ash-50 px-4 py-3 text-sm">
                  <span className="text-carbon-500">เครดิตคงเหลือหลังจอง</span>
                  <Badge tone="pulse">
                    {Math.max(0, (subscription?.remainingSessions ?? 0) - 1)} เซสชัน
                  </Badge>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
