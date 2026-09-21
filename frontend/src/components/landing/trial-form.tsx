"use client";

import axios from "axios";
import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { leadApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const TIMES: [string, string][] = [
  ["", "ไม่ระบุ"],
  ["MORNING", "เช้า (06:00–11:00)"],
  ["AFTERNOON", "บ่าย (11:00–16:00)"],
  ["EVENING", "เย็น (16:00–20:00)"],
  ["LATE", "ค่ำ (20:00–22:00)"],
];

const PHONE_PATTERN = /^[0-9+\-\s]{9,20}$/;

/** Landing-page free-pass request. Public endpoint: the hidden `website` field is a bot trap. */
export function TrialForm() {
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", preferredTime: "", website: "" });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.fullName.trim()) return setError("กรุณากรอกชื่อ-นามสกุล");
    if (!PHONE_PATTERN.test(form.phone.trim())) return setError("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง เช่น 081-234-5678");
    if (!consent) return setError("กรุณายอมรับเงื่อนไขการติดต่อกลับก่อนส่งข้อมูล");

    setBusy(true);
    try {
      await leadApi.create({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        preferredTime: form.preferredTime || null,
        website: form.website || null,
      });
      setDone(true);
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.status === 429
          ? "ส่งข้อมูลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่"
          : apiErrorMessage(err, "ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง"),
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-carbon-900" role="status">
        <CheckCircle2 className="mx-auto size-10 text-jade-500" />
        <p className="mt-3 font-display text-lg font-extrabold">ได้รับข้อมูลของคุณแล้ว</p>
        <p className="mt-1.5 text-sm text-carbon-500">
          ทีมงานจะโทรกลับเพื่อนัดวันเริ่มทดลองเล่นฟรี 3 วัน
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl bg-white p-6 text-left text-carbon-900">
      <Input
        label="ชื่อ-นามสกุล *"
        value={form.fullName}
        maxLength={160}
        autoComplete="name"
        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        placeholder="ศุภชัย รัตนโชติ"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="เบอร์โทรศัพท์ *"
          type="tel"
          value={form.phone}
          autoComplete="tel"
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="08X-XXX-XXXX"
        />
        <Input
          label="อีเมล"
          type="email"
          value={form.email}
          autoComplete="email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
        />
      </div>
      <Select
        label="ช่วงเวลาที่สะดวกให้ติดต่อ / เริ่มทดลอง"
        value={form.preferredTime}
        onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
      >
        {TIMES.map(([value, label]) => (
          <option key={label} value={value}>
            {label}
          </option>
        ))}
      </Select>

      {/* Honeypot: off-screen and skipped by keyboard/AT users; only bots fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </label>
      </div>

      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-carbon-500">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-pulse-500"
        />
        ฉันยินยอมให้ TP Fitness ติดต่อกลับเพื่อนัดหมายทดลองเล่นฟรีตามข้อมูลที่ให้ไว้
      </label>

      {error && (
        <p role="alert" className="rounded-lg bg-ember-50 px-3.5 py-2.5 text-sm font-medium text-ember-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" loading={busy} className="w-full">
        <Send className="size-4" /> รับสิทธิ์ทดลองเล่นฟรี 3 วัน
      </Button>
    </form>
  );
}
