"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Plus, Star, UserCog } from "lucide-react";
import { authApi, memberApi, trainerApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import type { Trainer, UserStatus } from "@/lib/types";
import { formatTHB } from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { Card, EmptyState } from "@/components/ui/card";
import { Avatar, Skeleton, StatCard } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

const STATUS_OPTIONS: [UserStatus, string][] = [
  ["ACTIVE", "ปฏิบัติงาน"],
  ["INACTIVE", "พักงานชั่วคราว"],
  ["SUSPENDED", "ระงับสิทธิ์"],
];

export default function AdminTrainersPage() {
  const toast = useToast();
  const [trainers, setTrainers] = useState<Trainer[] | null>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    specialization: "",
  });

  const load = useCallback(async () => {
    try {
      setTrainers(await trainerApi.list());
    } catch (err) {
      setTrainers([]);
      toast.error(apiErrorMessage(err, "ไม่สามารถโหลดรายชื่อเทรนเนอร์ได้"));
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTrainer() {
    if (!form.fullName.trim() || !form.email.trim() || form.password.length < 8) {
      toast.error("กรุณากรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 8 ตัวอักษร");
      return;
    }
    setSaving(true);
    try {
      await authApi.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber.trim() || undefined,
        role: "TRAINER",
        specialization: form.specialization.trim() || undefined,
      });
      toast.success("เพิ่มเทรนเนอร์เข้าระบบเรียบร้อยแล้ว");
      setAddOpen(false);
      setForm({ fullName: "", email: "", phoneNumber: "", password: "", specialization: "" });
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถเพิ่มเทรนเนอร์ได้"));
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(trainer: Trainer, status: UserStatus) {
    try {
      await memberApi.setStatus(trainer.id, status);
      toast.success(`อัปเดตสถานะของ ${trainer.fullName} เรียบร้อยแล้ว`);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถอัปเดตสถานะได้"));
    }
  }

  const term = search.trim().toLowerCase();
  const filtered = (trainers ?? []).filter(
    (t) =>
      t.fullName.toLowerCase().includes(term) ||
      (t.specialization ?? "").toLowerCase().includes(term),
  );

  const averageRate =
    trainers && trainers.length > 0
      ? trainers.reduce((sum, t) => sum + t.hourlyRate, 0) / trainers.length
      : 0;
  const averageRating =
    trainers && trainers.length > 0
      ? trainers.reduce((sum, t) => sum + t.ratingAverage, 0) / trainers.length
      : 0;

  return (
    <>
      <PageHeading
        eyebrow="Trainer Workforce"
        title="บุคลากรเทรนเนอร์"
        description="ดูแลทีมโค้ช ปรับสถานะการปฏิบัติงาน และเพิ่มเทรนเนอร์ใหม่เข้าสู่ระบบ"
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> เพิ่มเทรนเนอร์
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="เทรนเนอร์ที่ปฏิบัติงาน"
          value={trainers?.length ?? 0}
          icon={<UserCog className="size-4" />}
        />
        <StatCard
          label="คะแนนเฉลี่ยของทีม"
          value={averageRating.toFixed(2)}
          icon={<Star className="size-4" />}
          tone="jade"
        />
        <StatCard label="ค่าบริการเฉลี่ย / ชม." value={formatTHB(averageRate)} tone="carbon" />
      </div>

      <div className="my-6 sm:w-80">
        <Input
          placeholder="ค้นหาชื่อหรือสาขาที่เชี่ยวชาญ…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="ค้นหาเทรนเนอร์"
        />
      </div>

      {!trainers && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      )}

      {trainers && filtered.length === 0 && (
        <EmptyState
          icon={<UserCog className="size-7" />}
          title="ไม่พบเทรนเนอร์"
          description="ลองค้นหาด้วยคำอื่น หรือเพิ่มเทรนเนอร์ใหม่เข้าสู่ระบบ"
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((trainer) => (
          <Card key={trainer.id} className="flex flex-col p-5">
            <div className="flex items-center gap-3.5">
              <Avatar name={trainer.fullName} src={trainer.avatarUrl} size={50} />
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold text-carbon-900">
                  {trainer.fullName}
                </p>
                <p className="truncate text-xs text-carbon-500">{trainer.email}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-pulse-500">
                  <Star className="size-3 fill-current" /> {trainer.ratingAverage.toFixed(2)}
                  <span className="font-normal text-carbon-500">
                    ({trainer.ratingCount} รีวิว)
                  </span>
                </p>
              </div>
            </div>

            {trainer.specialization && (
              <Badge tone="pulse" className="mt-4 self-start">
                {trainer.specialization}
              </Badge>
            )}

            <dl className="mt-4 space-y-1.5 text-xs text-carbon-500">
              <div className="flex justify-between gap-3">
                <dt>ประสบการณ์</dt>
                <dd className="font-semibold text-carbon-900">{trainer.yearsOfExperience} ปี</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>ค่าบริการ / ชม.</dt>
                <dd className="font-semibold text-carbon-900">{formatTHB(trainer.hourlyRate)}</dd>
              </div>
            </dl>

            {trainer.certifications && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-ash-300 bg-ash-50 px-3 py-2 text-[11px] text-carbon-700">
                <Award className="mt-0.5 size-3 shrink-0 text-pulse-500" />
                {trainer.certifications}
              </p>
            )}

            <div className="mt-5 flex flex-1 items-end">
              <Select
                aria-label={`เปลี่ยนสถานะของ ${trainer.fullName}`}
                defaultValue="ACTIVE"
                onChange={(e) => void setStatus(trainer, e.target.value as UserStatus)}
                className="w-full"
              >
                {STATUS_OPTIONS.map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="เพิ่มเทรนเนอร์เข้าสู่ระบบ"
        description="บัญชีจะถูกสร้างพร้อมสิทธิ์ TRAINER ทันที"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              ยกเลิก
            </Button>
            <Button loading={saving} onClick={() => void createTrainer()}>
              สร้างบัญชีเทรนเนอร์
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="ชื่อ-นามสกุล *"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="มาร์คัส แวนซ์"
          />
          <Input
            label="อีเมล *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="coach@fitpulse.io"
          />
          <Input
            label="เบอร์โทรศัพท์"
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            placeholder="08X-XXX-XXXX"
          />
          <Input
            label="รหัสผ่านเริ่มต้น *"
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            hint="อย่างน้อย 8 ตัวอักษร แนะนำให้เทรนเนอร์เปลี่ยนหลังเข้าสู่ระบบครั้งแรก"
          />
          <Input
            label="สาขาที่เชี่ยวชาญ"
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            placeholder="Strength & Hypertrophy"
          />
        </div>
      </Modal>
    </>
  );
}
