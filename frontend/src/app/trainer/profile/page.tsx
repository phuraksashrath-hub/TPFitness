"use client";

import { useEffect, useState } from "react";
import { Award, KeyRound, Save, Star } from "lucide-react";
import { authApi, trainerApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Trainer } from "@/lib/types";
import { formatTHB } from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export default function TrainerProfilePage() {
  const toast = useToast();
  const { user, refresh } = useAuth();

  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [account, setAccount] = useState({ fullName: "", phoneNumber: "", avatarUrl: "" });
  const [expertise, setExpertise] = useState({
    specialization: "",
    bio: "",
    certifications: "",
    yearsOfExperience: 0,
    hourlyRate: 0,
  });
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingExpertise, setSavingExpertise] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setAccount({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber ?? "",
      avatarUrl: user.avatarUrl ?? "",
    });

    trainerApi
      .byId(user.id)
      .then((data) => {
        setTrainer(data);
        setExpertise({
          specialization: data.specialization ?? "",
          bio: data.bio ?? "",
          certifications: data.certifications ?? "",
          yearsOfExperience: data.yearsOfExperience,
          hourlyRate: data.hourlyRate,
        });
      })
      .catch(() => setTrainer(null));
  }, [user]);

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setSavingAccount(true);
    try {
      await authApi.updateProfile({
        fullName: account.fullName.trim(),
        phoneNumber: account.phoneNumber.trim() || null,
        avatarUrl: account.avatarUrl.trim() || null,
      });
      await refresh();
      toast.success("บันทึกข้อมูลบัญชีเรียบร้อยแล้ว");
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถบันทึกข้อมูลบัญชีได้"));
    } finally {
      setSavingAccount(false);
    }
  }

  async function saveExpertise(e: React.FormEvent) {
    e.preventDefault();
    setSavingExpertise(true);
    try {
      const updated = await trainerApi.updateExpertise({
        specialization: expertise.specialization.trim() || null,
        bio: expertise.bio.trim() || null,
        certifications: expertise.certifications.trim() || null,
        yearsOfExperience: Number(expertise.yearsOfExperience),
        hourlyRate: Number(expertise.hourlyRate),
      });
      setTrainer(updated);
      toast.success("อัปเดตโปรไฟล์โค้ชแล้ว ข้อมูลจะแสดงบนหน้าเว็บไซต์ทันที");
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถบันทึกโปรไฟล์โค้ชได้"));
    } finally {
      setSavingExpertise(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.next !== password.confirm) {
      toast.error("รหัสผ่านใหม่และการยืนยันไม่ตรงกัน");
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword(password.current, password.next);
      setPassword({ current: "", next: "", confirm: "" });
      toast.success("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถเปลี่ยนรหัสผ่านได้"));
    } finally {
      setSavingPassword(false);
    }
  }

  if (!user) return null;

  return (
    <>
      <PageHeading
        eyebrow="Coach Profile"
        title="โปรไฟล์โค้ชและข้อมูลบัญชี"
        description="ข้อมูลความเชี่ยวชาญและค่าบริการจะแสดงบนหน้าเว็บไซต์และหน้าจองของสมาชิก"
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="ความเชี่ยวชาญและค่าบริการ"
              subtitle="ปรับข้อมูลที่สมาชิกเห็นตอนเลือกโค้ช"
            />
            <CardBody>
              {!trainer ? (
                <Skeleton className="h-64" />
              ) : (
                <form onSubmit={saveExpertise} className="space-y-4">
                  <Input
                    label="สาขาที่เชี่ยวชาญ"
                    value={expertise.specialization}
                    onChange={(e) =>
                      setExpertise({ ...expertise, specialization: e.target.value })
                    }
                    placeholder="Strength & Hypertrophy"
                  />
                  <Textarea
                    label="แนะนำตัว (Bio)"
                    value={expertise.bio}
                    onChange={(e) => setExpertise({ ...expertise, bio: e.target.value })}
                    placeholder="โค้ชผู้เชี่ยวชาญด้านการสร้างกล้ามเนื้อและเตรียมนักกีฬาลงแข่ง HYROX"
                    className="min-h-28"
                  />
                  <Input
                    label="ใบรับรอง (คั่นด้วยเครื่องหมายจุลภาค)"
                    value={expertise.certifications}
                    onChange={(e) =>
                      setExpertise({ ...expertise, certifications: e.target.value })
                    }
                    placeholder="NSCA-CSCS, ACE-CPT, HYROX Certified"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="ประสบการณ์ (ปี)"
                      type="number"
                      min={0}
                      max={60}
                      value={expertise.yearsOfExperience}
                      onChange={(e) =>
                        setExpertise({ ...expertise, yearsOfExperience: Number(e.target.value) })
                      }
                    />
                    <Input
                      label="ค่าบริการต่อชั่วโมง (บาท)"
                      type="number"
                      min={0}
                      value={expertise.hourlyRate}
                      onChange={(e) =>
                        setExpertise({ ...expertise, hourlyRate: Number(e.target.value) })
                      }
                    />
                  </div>

                  <Button type="submit" loading={savingExpertise}>
                    <Save className="size-4" /> บันทึกโปรไฟล์โค้ช
                  </Button>
                </form>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="ข้อมูลบัญชี" />
            <CardBody>
              <form onSubmit={saveAccount} className="space-y-4">
                <Input
                  label="ชื่อ-นามสกุล *"
                  required
                  value={account.fullName}
                  onChange={(e) => setAccount({ ...account, fullName: e.target.value })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="เบอร์โทรศัพท์"
                    type="tel"
                    value={account.phoneNumber}
                    onChange={(e) => setAccount({ ...account, phoneNumber: e.target.value })}
                    placeholder="08X-XXX-XXXX"
                  />
                  <Input
                    label="ลิงก์รูปโปรไฟล์"
                    type="url"
                    value={account.avatarUrl}
                    onChange={(e) => setAccount({ ...account, avatarUrl: e.target.value })}
                    placeholder="https://…"
                  />
                </div>

                <Button type="submit" loading={savingAccount}>
                  <Save className="size-4" /> บันทึกข้อมูลบัญชี
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="ความปลอดภัยของบัญชี" />
            <CardBody>
              <form onSubmit={changePassword} className="space-y-4">
                <Input
                  label="รหัสผ่านปัจจุบัน *"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password.current}
                  onChange={(e) => setPassword({ ...password, current: e.target.value })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="รหัสผ่านใหม่ *"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password.next}
                    onChange={(e) => setPassword({ ...password, next: e.target.value })}
                  />
                  <Input
                    label="ยืนยันรหัสผ่านใหม่ *"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                  />
                </div>

                <Button type="submit" variant="carbon" loading={savingPassword}>
                  <KeyRound className="size-4" /> เปลี่ยนรหัสผ่าน
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Live preview of the public coach card */}
        <Card className="h-fit p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-pulse-500">
            ตัวอย่างที่สมาชิกเห็น
          </p>
          <div className="flex items-center gap-4">
            <Avatar name={account.fullName} src={account.avatarUrl || user.avatarUrl} size={56} />
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold text-carbon-900">
                {account.fullName}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-pulse-500">
                <Star className="size-3.5 fill-current" />
                {(trainer?.ratingAverage ?? 0).toFixed(2)}
                <span className="font-normal text-carbon-500">
                  ({trainer?.ratingCount ?? 0} รีวิว)
                </span>
              </p>
            </div>
          </div>

          {expertise.specialization && (
            <Badge tone="pulse" className="mt-4">
              {expertise.specialization}
            </Badge>
          )}

          <p className="mt-4 text-sm leading-relaxed text-carbon-500">
            {expertise.bio || "ยังไม่ได้เขียนแนะนำตัว"}
          </p>

          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-ash-300 pt-4 text-center">
            <div>
              <dt className="text-[11px] text-carbon-500">ประสบการณ์</dt>
              <dd className="mt-1 font-display text-lg font-bold text-carbon-900">
                {expertise.yearsOfExperience} ปี
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-carbon-500">ค่าบริการ</dt>
              <dd className="mt-1 font-display text-lg font-bold text-carbon-900">
                {formatTHB(expertise.hourlyRate)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-carbon-500">สถานะ</dt>
              <dd className="mt-1 flex justify-center">
                <StatusBadge value={user.status} />
              </dd>
            </div>
          </dl>

          {expertise.certifications && (
            <p className="mt-4 flex items-start gap-2 rounded-lg border border-ash-300 bg-ash-50 px-3 py-2.5 text-xs text-carbon-700">
              <Award className="mt-0.5 size-3.5 shrink-0 text-pulse-500" />
              {expertise.certifications}
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
