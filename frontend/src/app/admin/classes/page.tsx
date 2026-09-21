"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Pencil, Plus, Users, XCircle } from "lucide-react";
import { branchApi, classApi, trainerApi } from "@/lib/services";
import type { SaveClassPayload } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import { CLASS_CATEGORIES, categoryLabel } from "@/lib/class-meta";
import type { Branch, ClassAttendee, GroupClass, Trainer } from "@/lib/types";
import { addDays, formatTime, formatWeekday, startOfUtcDay, toDateKey } from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { Card, EmptyState } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

interface ClassForm {
  title: string;
  category: string;
  instructorId: string;
  branchId: string;
  room: string;
  date: string;
  time: string;
  durationMinutes: number;
  capacity: number;
  description: string;
}

const DURATIONS = [30, 45, 50, 60, 75, 90, 120];
const RANGE_DAYS = 60;

const emptyForm = (): ClassForm => ({
  title: "",
  category: "HIIT",
  instructorId: "",
  branchId: "",
  room: "",
  date: toDateKey(addDays(new Date(), 1)),
  time: "18:00",
  durationMinutes: 60,
  capacity: 20,
  description: "",
});

export default function AdminClassesPage() {
  const toast = useToast();
  const [classes, setClasses] = useState<GroupClass[] | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GroupClass | null>(null);
  const [form, setForm] = useState<ClassForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [cancelling, setCancelling] = useState<GroupClass | null>(null);
  const [rosterFor, setRosterFor] = useState<GroupClass | null>(null);
  // Refreshed every minute so a class that just ended stops offering edit/cancel on a long-open page.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const [roster, setRoster] = useState<ClassAttendee[] | null>(null);

  const load = useCallback(async () => {
    try {
      const from = startOfUtcDay(new Date());
      setClasses(await classApi.manage(from.toISOString(), addDays(from, RANGE_DAYS).toISOString()));
    } catch (err) {
      setClasses([]);
      toast.error(apiErrorMessage(err, "ไม่สามารถโหลดรายการคลาสได้"));
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    trainerApi.list().then(setTrainers).catch(() => setTrainers([]));
    branchApi.all().then((list) => setBranches(list.filter((b) => b.isActive))).catch(() => setBranches([]));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm(), instructorId: trainers[0] ? String(trainers[0].id) : "" });
    setFormOpen(true);
  }

  function openEdit(item: GroupClass) {
    const start = new Date(item.startTime);
    setEditing(item);
    setForm({
      title: item.title,
      category: item.category,
      instructorId: String(item.instructorId),
      branchId: item.branchId ? String(item.branchId) : "",
      room: item.room ?? "",
      date: toDateKey(start),
      time: `${String(start.getUTCHours()).padStart(2, "0")}:${String(start.getUTCMinutes()).padStart(2, "0")}`,
      durationMinutes: Math.round((new Date(item.endTime).getTime() - start.getTime()) / 60000),
      capacity: item.capacity,
      description: item.description ?? "",
    });
    setFormOpen(true);
  }

  async function save() {
    if (!form.title.trim() || !form.instructorId) {
      toast.error("กรุณาระบุชื่อคลาสและเลือกผู้สอน");
      return;
    }
    const payload: SaveClassPayload = {
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim() || null,
      room: form.room.trim() || null,
      instructorId: Number(form.instructorId),
      branchId: form.branchId ? Number(form.branchId) : null,
      startTime: `${form.date}T${form.time}:00Z`,
      durationMinutes: form.durationMinutes,
      capacity: form.capacity,
    };
    setSaving(true);
    try {
      if (editing) await classApi.update(editing.id, payload);
      else await classApi.create(payload);
      toast.success(editing ? "อัปเดตคลาสเรียบร้อยแล้ว" : "เพิ่มคลาสเข้าตารางเรียบร้อยแล้ว");
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถบันทึกคลาสได้"));
    } finally {
      setSaving(false);
    }
  }

  async function cancelClass() {
    if (!cancelling) return;
    setSaving(true);
    try {
      await classApi.cancelClass(cancelling.id);
      toast.success(`ยกเลิกคลาส ${cancelling.title} แล้ว ที่นั่งของสมาชิกทุกคนถูกคืน`);
      setCancelling(null);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถยกเลิกคลาสได้"));
    } finally {
      setSaving(false);
    }
  }

  async function openRoster(item: GroupClass) {
    setRosterFor(item);
    setRoster(null);
    try {
      setRoster(await classApi.roster(item.id));
    } catch (err) {
      setRoster([]);
      toast.error(apiErrorMessage(err, "ไม่สามารถโหลดรายชื่อผู้เข้าเรียนได้"));
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Group Classes"
        title="จัดการคลาสกรุ๊ป"
        description={`ตารางคลาสล่วงหน้า ${RANGE_DAYS} วัน ผู้สอนที่ติดสอนจะถูกจอง PT ทับไม่ได้ และคลาสที่ยกเลิกจะคืนที่นั่งให้สมาชิกอัตโนมัติ`}
        action={
          <Button onClick={openCreate} disabled={trainers.length === 0}>
            <Plus className="size-4" /> เพิ่มคลาส
          </Button>
        }
      />

      {!classes && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {classes?.length === 0 && (
        <EmptyState
          icon={<CalendarDays className="size-7" />}
          title="ยังไม่มีคลาสในช่วงนี้"
          description="เพิ่มคลาสแรกเข้าตาราง สมาชิกจะเห็นและจองที่นั่งได้ทันที"
        />
      )}

      {classes && classes.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] text-left text-sm">
              <thead className="bg-ash-200 text-[11px] font-bold uppercase tracking-wider text-carbon-500">
                <tr>
                  <th className="px-5 py-3.5">วัน-เวลา (UTC)</th>
                  <th className="px-5 py-3.5">คลาส</th>
                  <th className="px-5 py-3.5">ผู้สอน</th>
                  <th className="px-5 py-3.5">สาขา / ห้อง</th>
                  <th className="px-5 py-3.5">ที่นั่ง</th>
                  <th className="px-5 py-3.5">สถานะ</th>
                  <th className="px-5 py-3.5 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ash-300">
                {classes.map((c) => {
                  const cancelled = c.status === "CANCELLED";
                  const past = new Date(c.endTime).getTime() <= now;
                  return (
                    <tr key={c.id} className={cn("align-top", (cancelled || past) && "opacity-60")}>
                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="font-semibold text-carbon-900">{formatWeekday(c.startTime)}</p>
                        <p className="text-xs text-carbon-500">
                          {formatTime(c.startTime)}–{formatTime(c.endTime)} น.
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className={cn("font-display font-bold text-carbon-900", cancelled && "line-through")}>{c.title}</p>
                        <Badge tone="pulse" className="mt-1">
                          {categoryLabel(c.category)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-carbon-700">
                          <Avatar name={c.instructorName} src={c.instructorAvatarUrl} size={26} /> {c.instructorName}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-carbon-700">{[c.branchName, c.room].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-carbon-900">
                        {c.bookedCount} / {c.capacity}
                        {c.seatsLeft === 0 && !cancelled && <span className="ml-2 text-xs text-pulse-600">เต็ม</span>}
                      </td>
                      <td className="px-5 py-4">
                        {cancelled ? <Badge tone="ember">ยกเลิกแล้ว</Badge> : past ? <Badge tone="ash">จบแล้ว</Badge> : <Badge tone="jade">เปิดรับ</Badge>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => void openRoster(c)} aria-label={`รายชื่อผู้เข้าเรียน ${c.title}`}>
                            <Users className="size-4" />
                          </Button>
                          {!cancelled && !past && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => openEdit(c)} aria-label={`แก้ไข ${c.title}`}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setCancelling(c)} aria-label={`ยกเลิก ${c.title}`}>
                                <XCircle className="size-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "แก้ไขคลาส" : "เพิ่มคลาสใหม่"}
        description="เวลาทั้งหมดเป็น UTC ระบบจะตรวจว่าผู้สอนว่างจริง (ไม่ชนคลาสอื่น นัด PT หรือช่วงที่บล็อกไว้)"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              ยกเลิก
            </Button>
            <Button loading={saving} onClick={() => void save()}>
              {editing ? "บันทึก" : "เพิ่มคลาส"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="ชื่อคลาส *" value={form.title} maxLength={160} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="HIIT Express" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="ประเภท" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.entries(CLASS_CATEGORIES).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </Select>
            <Select label="ผู้สอน *" value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value })}>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="สาขา" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">ไม่ระบุ</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            <Input label="ห้อง / โซน" value={form.room} maxLength={80} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Studio A" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="วันที่ *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="เวลาเริ่ม *" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="ระยะเวลา" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} นาที
                </option>
              ))}
            </Select>
            <Input
              label="จำนวนที่นั่ง"
              type="number"
              min={1}
              max={200}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              hint={editing && editing.bookedCount > 0 ? `มีผู้จองแล้ว ${editing.bookedCount} คน` : undefined}
            />
          </div>
          <Textarea label="รายละเอียด" value={form.description} maxLength={1000} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </Modal>

      <Modal
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        title="ยกเลิกคลาสนี้?"
        description={cancelling ? `${cancelling.title} · ${formatWeekday(cancelling.startTime)} ${formatTime(cancelling.startTime)} น.` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelling(null)}>
              ไม่ยกเลิก
            </Button>
            <Button loading={saving} onClick={() => void cancelClass()}>
              ยืนยันยกเลิกคลาส
            </Button>
          </>
        }
      >
        <p className="text-sm text-carbon-500">
          {cancelling && cancelling.bookedCount > 0
            ? `มีสมาชิกจองไว้ ${cancelling.bookedCount} คน ที่นั่งจะถูกปล่อยและคลาสจะหายจากรายการของสมาชิก`
            : "ยังไม่มีสมาชิกจองคลาสนี้"}
        </p>
      </Modal>

      <Modal
        open={rosterFor !== null}
        onClose={() => setRosterFor(null)}
        title="รายชื่อผู้เข้าเรียน"
        description={rosterFor ? `${rosterFor.title} · ${rosterFor.bookedCount}/${rosterFor.capacity} ที่นั่ง` : undefined}
        size="sm"
      >
        {!roster && <Skeleton className="h-24" />}
        {roster?.length === 0 && <p className="text-sm text-carbon-500">ยังไม่มีผู้จอง</p>}
        <ul className="space-y-2">
          {roster?.map((a) => (
            <li key={a.memberId} className="flex items-center gap-3 rounded-lg bg-ash-100 px-3 py-2.5">
              <Avatar name={a.fullName} src={a.avatarUrl} size={32} />
              <span className="text-sm font-semibold text-carbon-900">{a.fullName}</span>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
