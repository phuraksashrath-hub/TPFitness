"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, UserPlus } from "lucide-react";
import { useAuth, portalPathFor } from "@/lib/auth-context";
import { Wordmark } from "@/components/landing/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

const PERKS = [
  "เข้าใช้บริการเต็มรูปแบบฟรี 3 วัน",
  "เทรนกับ Personal Trainer ฟรี 1 ครั้ง",
  "ตรวจวัดองค์ประกอบร่างกายและตั้งเป้าหมายฟรี",
  "รับ TP Fitness Gym Gear Pack มูลค่า 1,890 บาท",
];

function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return Math.min(score, 4);
}

export default function RegisterPage() {
  const { register, user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ fullName: "", email: "", phoneNumber: "", password: "" });
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const score = useMemo(() => passwordScore(form.password), [form.password]);
  const strengthLabel = ["สั้นเกินไป", "อ่อน", "พอใช้", "แข็งแรง", "แข็งแรงมาก"][score];

  useEffect(() => {
    if (user) router.replace(portalPathFor(user.role));
  }, [user, router]);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError("กรุณาตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (!accepted) {
      setError("กรุณายอมรับข้อตกลงการให้บริการก่อนสมัครสมาชิก");
      return;
    }

    setSubmitting(true);
    try {
      const profile = await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber || undefined,
      });
      router.replace(portalPathFor(profile.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถสร้างบัญชีได้");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-ash-100 px-5 py-16">
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 hidden w-1/2 bg-carbon-900 lg:block"
        style={{
          backgroundImage:
            "radial-gradient(80% 70% at 80% 20%, rgba(230,27,35,0.4) 0%, transparent 65%)",
        }}
      />

      <div className="relative grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
        <div className="hidden animate-rise text-white lg:block">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" /> กลับสู่หน้าแรก
          </Link>

          <span className="inline-flex rounded-full bg-pulse-500 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em]">
            3-Day Free Pass
          </span>

          <h1 className="jersey mt-5 font-display text-[42px] font-extrabold leading-[1.05]">
            ทดลองเล่นฟรี
            <br />
            <span className="text-pulse-500">3 วันเต็ม</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-ash-500">
            สมัครสมาชิก TP Fitness แล้วพอร์ทัลของคุณจะพร้อมใช้งานทันที
            จองเทรนเนอร์ ติดตามเซสชันคงเหลือ และจัดการแพ็กเกจได้ในที่เดียว
          </p>

          <ul className="mt-8 space-y-3.5">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-pulse-500 text-white">
                  <Check className="size-3" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="surface animate-rise p-8">
          <Wordmark className="mb-7 lg:hidden" />

          <h2 className="font-display text-2xl font-extrabold tracking-tight text-carbon-900">
            ลงทะเบียนสมาชิกออนไลน์
          </h2>
          <p className="mt-2 text-sm text-carbon-500">
            ใช้เวลาไม่ถึง 1 นาที เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันสิทธิ์ภายใน 24 ชม.
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
            <Input
              label="ชื่อ-นามสกุล *"
              required
              autoComplete="name"
              value={form.fullName}
              onChange={update("fullName")}
              placeholder="ศุภชัย รัตนโชติ"
            />
            <Input
              label="อีเมล *"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={update("email")}
              placeholder="you@example.com"
            />
            <Input
              label="เบอร์โทรศัพท์"
              type="tel"
              autoComplete="tel"
              value={form.phoneNumber}
              onChange={update("phoneNumber")}
              placeholder="08X-XXX-XXXX"
              hint="ใช้สำหรับการชำระเงินผ่าน PromptPay และแจ้งเตือนการเข้าคลับ"
            />

            <div>
              <Input
                label="รหัสผ่าน *"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={update("password")}
                placeholder="อย่างน้อย 8 ตัวอักษร"
              />
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < score ? "bg-pulse-500" : "bg-ash-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-carbon-500">{strengthLabel}</span>
                </div>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-carbon-500">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded-[4px] accent-pulse-500"
              />
              <span>
                ข้าพเจ้ายอมรับ
                <span className="mx-1 font-semibold text-pulse-500 underline">
                  ข้อตกลงการให้บริการ
                </span>
                และนโยบายคุ้มครองข้อมูลส่วนบุคคลของ TP Fitness
              </span>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-ember-500/30 bg-ember-50 px-3 py-2.5 text-sm font-medium text-ember-600"
              >
                {error}
              </p>
            )}

            <Button type="submit" loading={submitting} className="w-full">
              <UserPlus className="size-4" /> ยืนยันการลงทะเบียน
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-carbon-500">
            เป็นสมาชิกอยู่แล้ว?{" "}
            <Link href="/login" className="font-bold text-pulse-500 hover:text-pulse-600">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
