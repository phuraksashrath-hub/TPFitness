"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, Plus } from "lucide-react";
import { sessionApi, trainerApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { TrainerBlock, WorkoutSession } from "@/lib/types";
import {
  addDays,
  formatTime,
  formatWeekday,
  formatWeekdayShort,
  startOfUtcDay,
  toDateKey,
} from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const OPEN_HOUR = 6;
const CLOSE_HOUR = 22;
const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => i + OPEN_HOUR); // 06:00 – 21:00 UTC
const HOUR_MS = 3_600_000;

const pad = (n: number) => String(n).padStart(2, "0");
const hourLabel = (h: number) => `${pad(h)}:00`;

/** Wall-clock hour cell (UTC) as a Date. */
const cellStart = (day: Date, hour: number) => new Date(startOfUtcDay(day).getTime() + hour * HOUR_MS);

const blockCovers = (block: TrainerBlock, start: Date) => {
  const from = start.getTime();
  return new Date(block.startTime).getTime() < from + HOUR_MS && from < new Date(block.endTime).getTime();
};

interface BlockForm {
  date: string;
  startHour: number;
  endHour: number;
  reason: string;
}

export default function TrainerSchedulePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const [sessions, setSessions] = useState<WorkoutSession[] | null>(null);
  const [blocks, setBlocks] = useState<TrainerBlock[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<BlockForm>({ date: "", startHour: 9, endHour: 10, reason: "" });
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<TrainerBlock | null>(null);
  // Refreshed every minute so cells that slip into the past stop offering "block" on a long-open page.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const weekStart = useMemo(
    () => startOfUtcDay(addDays(new Date(), weekOffset * 7)),
    [weekOffset],
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const load = useCallback(async () => {
    if (!user) return;
    setSessions(null);
    try {
      const from = weekStart.toISOString();
      const to = addDays(weekStart, 7).toISOString();
      const [sessionList, blockList] = await Promise.all([
        sessionApi.byTrainer(user.id, from, to),
        trainerApi.blocks(from, to),
      ]);
      setSessions(sessionList);
      setBlocks(blockList);
    } catch (err) {
      setSessions([]);
      setBlocks([]);
      toast.error(apiErrorMessage(err, "ไม่สามารถโหลดตารางสอนได้"));
    }
  }, [user, weekStart, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const byDay = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const session of sessions ?? []) {
      const key = toDateKey(new Date(session.startTime));
      map.set(key, [...(map.get(key) ?? []), session]);
    }
    return map;
  }, [sessions]);

  function openForm(day?: Date, hour?: number) {
    const target = day ?? addDays(new Date(), 1);
    const start = hour ?? 9;
    setForm({ date: toDateKey(target), startHour: start, endHour: Math.min(start + 1, CLOSE_HOUR), reason: "" });
    setFormOpen(true);
  }

  async function saveBlock() {
    if (!form.date) {
      toast.error("กรุณาเลือกวันที่ต้องการบล็อก");
      return;
    }
    if (form.endHour <= form.startHour) {
      toast.error("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม");
      return;
    }
    setSaving(true);
    try {
      await trainerApi.createBlock({
        startTime: `${form.date}T${pad(form.startHour)}:00:00Z`,
        endTime: `${form.date}T${pad(form.endHour)}:00:00Z`,
        reason: form.reason.trim() || null,
      });
      toast.success("บล็อกเวลาเรียบร้อยแล้ว สมาชิกจะไม่เห็นช่วงนี้เป็นเวลาว่าง");
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถบล็อกเวลาได้"));
    } finally {
      setSaving(false);
    }
  }

  async function removeBlock() {
    if (!removing) return;
    setSaving(true);
    try {
      await trainerApi.deleteBlock(removing.id);
      toast.success("ปลดบล็อกแล้ว ช่วงเวลานี้กลับมารับจองได้");
      setRemoving(null);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถปลดบล็อกได้"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="ตารางสอน Real-time"
        title="ตารางนัดหมายและการบล็อกเวลา"
        description="นัดหมายและช่วงที่ปิดรับคิวบนปฏิทินของคุณ แสดงเป็นรายชั่วโมงตามเวลา UTC คลิกช่องว่างเพื่อบล็อกเวลา"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => openForm()}>
              <Plus className="size-4" /> เพิ่มเวลาฝึก / บล็อกเวลา
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="สัปดาห์ก่อนหน้า"
              onClick={() => setWeekOffset((v) => v - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
              สัปดาห์นี้
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

      <div className="mb-5 flex flex-wrap items-center gap-4 text-xs font-semibold text-carbon-500">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-pulse-500" /> จองแล้ว
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-jade-500" /> เสร็จสิ้นแล้ว
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-carbon-700" /> ปิดรับคิว (บล็อก)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-dashed border-ash-500" /> ว่าง · คลิกเพื่อบล็อก
        </span>
      </div>

      {!sessions && <Skeleton className="h-[32rem]" />}

      {sessions && (
        <Card className="overflow-x-auto">
          <CardBody className="min-w-[54rem] p-0">
            <div className="grid grid-cols-[4.5rem_repeat(7,1fr)] border-b border-ash-300 bg-ash-50">
              <div />
              {days.map((day) => (
                <div key={toDateKey(day)} className="border-l border-ash-300 px-3 py-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-carbon-500">
                    {formatWeekdayShort(day.toISOString())}
                  </p>
                  <p className="mt-0.5 font-display text-lg font-bold text-carbon-900">
                    {day.getUTCDate()}
                  </p>
                </div>
              ))}
            </div>

            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[4.5rem_repeat(7,1fr)] border-b border-ash-200">
                <div className="px-3 py-4 text-right text-xs font-semibold text-carbon-500">
                  {hourLabel(hour)}
                </div>
                {days.map((day) => {
                  const start = cellStart(day, hour);
                  const session = byDay
                    .get(toDateKey(day))
                    ?.find((s) => new Date(s.startTime).getUTCHours() === hour && s.status !== "CANCELLED");
                  const block = session ? undefined : blocks.find((b) => blockCovers(b, start));
                  const isPast = start.getTime() <= now;

                  return (
                    <div key={`${toDateKey(day)}-${hour}`} className="min-h-14 border-l border-ash-200 p-1.5">
                      {session && (
                        <div
                          className={cn(
                            "h-full rounded-lg px-2.5 py-2 text-left",
                            session.status === "BOOKED"
                              ? "bg-pulse-500 text-white"
                              : "bg-jade-50 text-jade-600",
                          )}
                        >
                          <p className="truncate text-[11px] font-bold">{session.memberName}</p>
                          <p className="text-[11px] opacity-80">
                            {formatTime(session.startTime)}–{formatTime(session.endTime)}
                          </p>
                        </div>
                      )}

                      {block && (
                        <button
                          type="button"
                          onClick={() => setRemoving(block)}
                          title="คลิกเพื่อปลดบล็อก"
                          className="flex h-full w-full flex-col items-start justify-center rounded-lg bg-carbon-700 px-2.5 py-2 text-left text-white transition-colors hover:bg-carbon-600 focus-pulse"
                        >
                          <span className="flex items-center gap-1 text-[11px] font-bold">
                            <Lock className="size-3" /> ปิดรับคิว
                          </span>
                          {block.reason && (
                            <span className="w-full truncate text-[11px] opacity-80">{block.reason}</span>
                          )}
                        </button>
                      )}

                      {!session && !block && !isPast && (
                        <button
                          type="button"
                          onClick={() => openForm(day, hour)}
                          aria-label={`บล็อกเวลา ${toDateKey(day)} ${hourLabel(hour)}`}
                          className="grid h-full w-full place-items-center rounded-lg border border-dashed border-transparent text-transparent transition-colors hover:border-ash-500 hover:text-carbon-500 focus-pulse"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {sessions && sessions.length > 0 && (
        <Card className="mt-6">
          <CardBody className="space-y-2.5">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-pulse-500">
              รายการการจองทั้งหมด
            </p>
            {sessions
              .slice()
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((session) => (
                <div
                  key={session.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-ash-300 bg-ash-50 px-3.5 py-3"
                >
                  <Avatar name={session.memberName} src={session.memberAvatarUrl} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-carbon-900">
                      {session.memberName}
                    </p>
                    <p className="text-xs text-carbon-500">
                      {formatWeekday(session.startTime)} · {formatTime(session.startTime)}–
                      {formatTime(session.endTime)} น.
                    </p>
                  </div>
                  <StatusBadge value={session.status} />
                </div>
              ))}
          </CardBody>
        </Card>
      )}

      {sessions && sessions.length === 0 && (
        <p className="mt-5 text-sm text-carbon-500">
          สัปดาห์นี้ยังไม่มีการจอง สมาชิกจองคิวกับคุณได้ระหว่าง 06:00 ถึง 22:00 น. ยกเว้นช่วงที่คุณบล็อกไว้
        </p>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="บล็อกเวลาสอน"
        description="ช่วงที่บล็อกจะไม่แสดงเป็นเวลาว่าง และสมาชิกจองไม่ได้ (บล็อกทับเซสชันที่จองไว้แล้วไม่ได้)"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              ยกเลิก
            </Button>
            <Button loading={saving} onClick={() => void saveBlock()}>
              บล็อกเวลา
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="วันที่ (UTC)"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="เริ่ม"
              value={form.startHour}
              onChange={(e) => {
                const startHour = Number(e.target.value);
                setForm({ ...form, startHour, endHour: Math.max(form.endHour, startHour + 1) });
              }}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </Select>
            <Select
              label="สิ้นสุด"
              value={form.endHour}
              onChange={(e) => setForm({ ...form, endHour: Number(e.target.value) })}
            >
              {Array.from({ length: CLOSE_HOUR - form.startHour }, (_, i) => form.startHour + 1 + i).map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="เหตุผล (ไม่บังคับ)"
            value={form.reason}
            maxLength={200}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="ประชุมทีม / ลาพัก / สอนคลาสกรุ๊ป"
          />
        </div>
      </Modal>

      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="ปลดบล็อกเวลา"
        description={
          removing
            ? `${formatWeekday(removing.startTime)} · ${formatTime(removing.startTime)}–${formatTime(removing.endTime)} น.${removing.reason ? ` · ${removing.reason}` : ""}`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              เก็บไว้
            </Button>
            <Button loading={saving} onClick={() => void removeBlock()}>
              ปลดบล็อก
            </Button>
          </>
        }
      >
        <p className="text-sm text-carbon-500">ช่วงเวลานี้จะกลับมาเป็นเวลาว่างที่สมาชิกจองได้ทันที</p>
      </Modal>
    </>
  );
}
