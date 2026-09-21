"use client";

import { useEffect, useState } from "react";
import { KeyRound, Save, UserRound } from "lucide-react";
import { authApi, memberApi, subscriptionApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Subscription } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { TouchlessPass } from "@/components/portal/touchless-pass";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

const GENDERS = [
  ["", "ไม่ระบุ"],
  ["MALE", "ชาย"],
  ["FEMALE", "หญิง"],
  ["OTHER", "อื่น ๆ"],
];

export default function MemberProfilePage() {
  const toast = useToast();
  const { user, refresh } = useAuth();

  const [account, setAccount] = useState({ fullName: "", phoneNumber: "", avatarUrl: "" });
  const [metrics, setMetrics] = useState({
    dateOfBirth: "",
    gender: "",
    heightCm: "",
    weightKg: "",
    bodyFatPercent: "",
    muscleMassKg: "",
    fitnessGoal: "",
    emergencyContact: "",
  });
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setAccount({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber ?? "",
      avatarUrl: user.avatarUrl ?? "",
    });
  }, [user]);

  useEffect(() => {
    subscriptionApi.active().then(setSubscription).catch(() => setSubscription(null));
  }, []);

  // Without this the form always opened empty, and saving overwrote stored metrics with nulls.
  useEffect(() => {
    memberApi
      .metrics()
      .then((m) =>
        setMetrics({
          dateOfBirth: m.dateOfBirth ? m.dateOfBirth.slice(0, 10) : "",
          gender: m.gender ?? "",
          heightCm: m.heightCm?.toString() ?? "",
          weightKg: m.weightKg?.toString() ?? "",
          bodyFatPercent: m.bodyFatPercent?.toString() ?? "",
          muscleMassKg: m.muscleMassKg?.toString() ?? "",
          fitnessGoal: m.fitnessGoal ?? "",
          emergencyContact: m.emergencyContact ?? "",
        }),
      )
      .catch((err) => toast.error(apiErrorMessage(err, "ไม่สามารถโหลดข้อมูลร่างกายได้")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function saveMetrics(e: React.FormEvent) {
    e.preventDefault();
    setSavingMetrics(true);
    try {
      await memberApi.updateMetrics({
        dateOfBirth: metrics.dateOfBirth ? new Date(metrics.dateOfBirth).toISOString() : null,
        gender: metrics.gender || null,
        heightCm: metrics.heightCm ? Number(metrics.heightCm) : null,
        weightKg: metrics.weightKg ? Number(metrics.weightKg) : null,
        bodyFatPercent: metrics.bodyFatPercent ? Number(metrics.bodyFatPercent) : null,
        muscleMassKg: metrics.muscleMassKg ? Number(metrics.muscleMassKg) : null,
        fitnessGoal: metrics.fitnessGoal.trim() || null,
        emergencyContact: metrics.emergencyContact.trim() || null,
      });
      toast.success("บันทึกข้อมูลร่างกายเรียบร้อยแล้ว เทรนเนอร์จะเห็นเป้าหมายของคุณทันที");
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถบันทึกข้อมูลร่างกายได้"));
    } finally {
      setSavingMetrics(false);
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

  const bmi =
    metrics.heightCm && metrics.weightKg
      ? Number(metrics.weightKg) / Math.pow(Number(metrics.heightCm) / 100, 2)
      : null;

  return (
    <>
      <PageHeading
        eyebrow="Member Profile"
        title="โปรไฟล์และข้อมูลส่วนตัว"
        description="อัปเดตข้อมูลติดต่อ ข้อมูลร่างกาย และความปลอดภัยของบัญชีคุณ"
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="ข้อมูลบัญชี" subtitle="ชื่อที่แสดงให้เทรนเนอร์และเจ้าหน้าที่เห็น" />
            <CardBody>
              <form onSubmit={saveAccount} className="space-y-4">
                <div className="flex items-center gap-4 border-b border-ash-300 pb-5">
                  <Avatar name={account.fullName || user.fullName} src={user.avatarUrl} size={60} />
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold text-carbon-900">{user.fullName}</p>
                    <p className="text-sm text-carbon-500">{user.email}</p>
                    <p className="mt-1.5 flex items-center gap-2 text-xs">
                      <span className="font-mono text-carbon-500">
                        ID: #FP-{user.id.toString().padStart(5, "0")}
                      </span>
                      <StatusBadge value={user.status} />
                    </p>
                  </div>
                </div>

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
            <CardHeader
              title="ข้อมูลร่างกายและเป้าหมาย (InBody)"
              subtitle="ข้อมูลนี้ใช้เพื่อให้เทรนเนอร์ออกแบบโปรแกรมได้แม่นยำขึ้น"
            />
            <CardBody>
              <form onSubmit={saveMetrics} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="วันเกิด"
                    type="date"
                    value={metrics.dateOfBirth}
                    onChange={(e) => setMetrics({ ...metrics, dateOfBirth: e.target.value })}
                  />
                  <Select
                    label="เพศ"
                    value={metrics.gender}
                    onChange={(e) => setMetrics({ ...metrics, gender: e.target.value })}
                  >
                    {GENDERS.map(([value, label]) => (
                      <option key={label} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="ส่วนสูง (ซม.)"
                    type="number"
                    min={80}
                    max={250}
                    step="0.1"
                    value={metrics.heightCm}
                    onChange={(e) => setMetrics({ ...metrics, heightCm: e.target.value })}
                    placeholder="175"
                  />
                  <Input
                    label="น้ำหนัก (กก.)"
                    type="number"
                    min={25}
                    max={300}
                    step="0.1"
                    value={metrics.weightKg}
                    onChange={(e) => setMetrics({ ...metrics, weightKg: e.target.value })}
                    placeholder="79.2"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="ไขมันในร่างกาย (%)"
                    type="number"
                    min={2}
                    max={60}
                    step="0.1"
                    value={metrics.bodyFatPercent}
                    onChange={(e) => setMetrics({ ...metrics, bodyFatPercent: e.target.value })}
                    placeholder="12.4"
                  />
                  <Input
                    label="มวลกล้ามเนื้อ (กก.)"
                    type="number"
                    min={10}
                    max={120}
                    step="0.1"
                    value={metrics.muscleMassKg}
                    onChange={(e) => setMetrics({ ...metrics, muscleMassKg: e.target.value })}
                    placeholder="38.2"
                  />
                </div>

                {bmi !== null && Number.isFinite(bmi) && (
                  <div className="rounded-xl border border-ash-300 bg-ash-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-carbon-500">
                      ดัชนีมวลกาย (BMI)
                    </p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-pulse-500">
                      {bmi.toFixed(1)}
                    </p>
                  </div>
                )}

                <Textarea
                  label="เป้าหมายการฝึก"
                  value={metrics.fitnessGoal}
                  onChange={(e) => setMetrics({ ...metrics, fitnessGoal: e.target.value })}
                  placeholder="สร้างกล้ามเนื้อและเตรียมแข่ง HYROX ภายใน 6 เดือน"
                />
                <Input
                  label="ผู้ติดต่อกรณีฉุกเฉิน"
                  value={metrics.emergencyContact}
                  onChange={(e) => setMetrics({ ...metrics, emergencyContact: e.target.value })}
                  placeholder="คุณสมชาย (พี่ชาย) 08X-XXX-XXXX"
                />

                <Button type="submit" loading={savingMetrics}>
                  <UserRound className="size-4" /> บันทึกข้อมูลร่างกาย
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="ความปลอดภัยของบัญชี" subtitle="รหัสผ่านถูกเก็บแบบแฮชด้วย BCrypt" />
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

        <div className="space-y-6">
          <TouchlessPass
            memberId={user.id}
            memberName={user.fullName}
            lockerCode={subscription ? `#B-${(user.id % 90) + 10}` : null}
          />

          <Card>
            <CardHeader title="สิทธิ์สมาชิกปัจจุบัน" />
            <CardBody className="space-y-3 text-sm">
              {subscription ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-carbon-500">แพ็กเกจ</span>
                    <span className="font-semibold text-carbon-900">{subscription.plan.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-carbon-500">สถานะ</span>
                    <StatusBadge value={subscription.status} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-carbon-500">หมดอายุ</span>
                    <span className="font-semibold text-carbon-900">
                      {formatDate(subscription.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-carbon-500">เซสชันคงเหลือ</span>
                    <span className="font-display font-bold text-pulse-500">
                      {subscription.remainingSessions}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-carbon-500">ยังไม่มีแพ็กเกจที่ใช้งานอยู่</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
