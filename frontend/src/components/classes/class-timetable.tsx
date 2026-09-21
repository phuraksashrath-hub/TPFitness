"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarX2, Clock, MapPin, Users } from "lucide-react";
import { branchApi, classApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { categoryLabel } from "@/lib/class-meta";
import type { Branch, GroupClass } from "@/lib/types";
import { addDays, formatTime, formatWeekday, formatWeekdayShort, startOfUtcDay, toDateKey } from "@/lib/format";
import { Card, EmptyState } from "@/components/ui/card";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const DAYS_AHEAD = 14;

/**
 * Group-class timetable shared by the public /classes page and the member portal.
 * Anyone can browse; only members can take a seat, and they see their own seats marked.
 */
export function ClassTimetable({ loginPath = "/classes" }: { loginPath?: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const params = useSearchParams();

  const [classes, setClasses] = useState<GroupClass[] | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [mine, setMine] = useState<GroupClass[]>([]);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("ALL");
  const [branchId, setBranchId] = useState<string>(params.get("branch") ?? "ALL");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const isMember = user?.role === "MEMBER";

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const days = useMemo(() => {
    const today = startOfUtcDay(new Date());
    return Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i));
  }, []);

  const load = useCallback(async () => {
    try {
      const from = days[0].toISOString();
      const to = addDays(days[0], DAYS_AHEAD).toISOString();
      setClasses(await classApi.list(from, to));
    } catch (err) {
      setClasses([]);
      toast.error(apiErrorMessage(err, "ไม่สามารถโหลดตารางคลาสได้"));
    }
  }, [days, toast]);

  const loadMine = useCallback(async () => {
    if (!isMember) {
      setMine([]);
      return;
    }
    try {
      setMine(await classApi.mine());
    } catch {
      setMine([]);
    }
  }, [isMember]);

  useEffect(() => {
    void load();
  }, [load, user]);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  useEffect(() => {
    branchApi.list().then(setBranches).catch(() => setBranches([]));
  }, []);

  const filtered = useMemo(
    () =>
      (classes ?? []).filter(
        (c) =>
          (category === "ALL" || c.category === category) &&
          (branchId === "ALL" || String(c.branchId) === branchId),
      ),
    [classes, category, branchId],
  );

  const categories = useMemo(() => [...new Set((classes ?? []).map((c) => c.category))].sort(), [classes]);

  const countByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of filtered) {
      if (new Date(c.startTime).getTime() <= now) continue;
      const key = toDateKey(new Date(c.startTime));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [filtered, now]);

  // Land on the first day that still has something to book.
  const selectedKey = dayKey ?? days.map(toDateKey).find((k) => (countByDay.get(k) ?? 0) > 0) ?? toDateKey(days[0]);
  const dayClasses = filtered.filter((c) => toDateKey(new Date(c.startTime)) === selectedKey);

  async function act(item: GroupClass, action: "book" | "cancel") {
    setBusyId(item.id);
    try {
      const updated = action === "book" ? await classApi.book(item.id) : await classApi.cancelSeat(item.id);
      setClasses((list) => (list ?? []).map((c) => (c.id === updated.id ? updated : c)));
      toast.success(
        action === "book"
          ? `จองที่นั่งคลาส ${item.title} เรียบร้อยแล้ว`
          : `ยกเลิกที่นั่งคลาส ${item.title} แล้ว`,
      );
      await loadMine();
    } catch (err) {
      toast.error(apiErrorMessage(err, action === "book" ? "ไม่สามารถจองที่นั่งได้" : "ไม่สามารถยกเลิกที่นั่งได้"));
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      {isMember && mine.length > 0 && (
        <section aria-label="คลาสที่คุณจองไว้">
          <h2 className="font-display text-lg font-extrabold text-carbon-900">คลาสที่คุณจองไว้</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mine.map((c) => (
              <Card key={c.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-display font-bold text-carbon-900">{c.title}</p>
                  <p className="text-xs text-carbon-500">
                    {formatWeekday(c.startTime)} · {formatTime(c.startTime)}–{formatTime(c.endTime)} น.
                  </p>
                  <p className="truncate text-xs text-carbon-500">
                    {[c.branchName, c.room].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  loading={busyId === c.id}
                  onClick={() => void act(c, "cancel")}
                >
                  ยกเลิก
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section aria-label="ตารางคลาส">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-48 flex-1 sm:max-w-xs">
            <Select
              label="สาขา"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <option value="ALL">ทุกสาขา</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="ประเภทคลาส">
            {["ALL", ...categories].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setCategory(code)}
                aria-pressed={category === code}
                className={cn(
                  "min-h-10 rounded-full border px-4 py-1.5 text-xs font-bold transition-colors focus-pulse",
                  category === code
                    ? "border-pulse-500 bg-pulse-500 text-white"
                    : "border-ash-300 bg-white text-carbon-500 hover:border-ash-500",
                )}
              >
                {code === "ALL" ? "ทั้งหมด" : categoryLabel(code)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="เลือกวัน">
          {days.map((day) => {
            const key = toDateKey(day);
            const count = countByDay.get(key) ?? 0;
            const active = key === selectedKey;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setDayKey(key)}
                className={cn(
                  "flex w-20 shrink-0 flex-col items-center rounded-xl border px-2 py-2.5 transition-colors focus-pulse",
                  active
                    ? "border-pulse-500 bg-pulse-500 text-white"
                    : "border-ash-300 bg-white text-carbon-700 hover:border-ash-500",
                )}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                  {formatWeekdayShort(day.toISOString())}
                </span>
                <span className="font-display text-xl font-extrabold leading-tight">{day.getUTCDate()}</span>
                <span className={cn("text-[11px] font-semibold", active ? "text-white/80" : "text-carbon-500")}>
                  {count > 0 ? `${count} คลาส` : "ไม่มีคลาส"}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-carbon-500">เวลาทั้งหมดแสดงตามเวลา UTC เหมือนส่วนอื่นของระบบ</p>

        <div className="mt-5 space-y-3">
          {!classes && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}

          {classes && dayClasses.length === 0 && (
            <EmptyState
              icon={<CalendarX2 className="size-7" />}
              title="วันนี้ไม่มีคลาสตามเงื่อนไขที่เลือก"
              description="ลองเลือกวันอื่น เปลี่ยนสาขา หรือดูคลาสประเภทอื่น"
            />
          )}

          {dayClasses.map((c) => {
            const started = new Date(c.startTime).getTime() <= now;
            const full = c.seatsLeft === 0;
            const pct = Math.min(100, Math.round((c.bookedCount / Math.max(1, c.capacity)) * 100));
            return (
              <Card key={c.id} className={cn("p-5", started && "opacity-60")}>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                  <div className="w-28 shrink-0">
                    <p className="flex items-center gap-1.5 font-display text-xl font-extrabold text-carbon-900">
                      <Clock className="size-4 text-pulse-500" /> {formatTime(c.startTime)}
                    </p>
                    <p className="text-xs text-carbon-500">ถึง {formatTime(c.endTime)} น.</p>
                  </div>

                  <div className="min-w-56 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-carbon-900">{c.title}</h3>
                      <Badge tone="pulse">{categoryLabel(c.category)}</Badge>
                      {c.isBookedByMe && <Badge tone="jade">จองแล้ว</Badge>}
                    </div>
                    {c.description && <p className="mt-1 text-sm text-carbon-500">{c.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-carbon-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar name={c.instructorName} src={c.instructorAvatarUrl} size={20} /> {c.instructorName}
                      </span>
                      {(c.branchName || c.room) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" /> {[c.branchName, c.room].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-40 shrink-0">
                    <div className="flex items-center justify-between text-xs font-semibold text-carbon-500">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" /> {c.bookedCount}/{c.capacity}
                      </span>
                      <span className={full ? "text-pulse-600" : "text-jade-600"}>
                        {full ? "เต็มแล้ว" : `เหลือ ${c.seatsLeft} ที่`}
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ash-300"
                      role="progressbar"
                      aria-valuenow={c.bookedCount}
                      aria-valuemin={0}
                      aria-valuemax={c.capacity}
                    >
                      <div className={cn("h-full rounded-full", full ? "bg-pulse-500" : "bg-jade-500")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="w-44 shrink-0 text-right">
                    {started ? (
                      <span className="text-sm font-semibold text-carbon-500">เริ่มไปแล้ว</span>
                    ) : !user ? (
                      <LinkButton href={`/login?next=${encodeURIComponent(loginPath)}`} size="sm" variant="outline">
                        เข้าสู่ระบบเพื่อจอง
                      </LinkButton>
                    ) : !isMember ? (
                      <span className="text-sm font-semibold text-carbon-500">จองได้เฉพาะสมาชิก</span>
                    ) : c.isBookedByMe ? (
                      <Button size="sm" variant="outline" loading={busyId === c.id} onClick={() => void act(c, "cancel")}>
                        ยกเลิกที่นั่ง
                      </Button>
                    ) : (
                      <Button size="sm" disabled={full} loading={busyId === c.id} onClick={() => void act(c, "book")}>
                        {full ? "เต็มแล้ว" : "จองที่นั่ง"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {isMember === false && user && (
          <p className="mt-4 text-sm text-carbon-500">
            บัญชี {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "เทรนเนอร์"} ดูตารางได้อย่างเดียว การจัดการคลาสอยู่ที่{" "}
            <Link href={user.role === "ADMIN" ? "/admin/classes" : "/trainer"} className="font-bold text-pulse-500 hover:text-pulse-600">
              {user.role === "ADMIN" ? "หลังบ้าน" : "พอร์ทัลเทรนเนอร์"}
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
