"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { useAuth, portalPathFor } from "@/lib/auth-context";
import { Wordmark } from "@/components/landing/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";

const DEMO_ACCOUNTS = [
  { role: "สมาชิก", email: "sophia@fitpulse.io" },
  { role: "เทรนเนอร์", email: "marcus@fitpulse.io" },
  { role: "ผู้ดูแลระบบ", email: "admin@fitpulse.io" },
];

/**
 * The quick-fill demo panel is for development and for deliberate public demos only. A production build hides it
 * (and the compiler drops the credentials) unless NEXT_PUBLIC_DEMO_LOGIN=true is set at build time.
 */
const SHOW_DEMO_LOGIN = process.env.NEXT_PUBLIC_DEMO_LOGIN === "true" || process.env.NODE_ENV !== "production";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "FitPulse#2026";

/** Where to go after signing in: the page the visitor came from, if it is a same-site page this role may open. */
function destinationFor(role: Parameters<typeof portalPathFor>[0]): string {
  const next = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("next");
  const allowed =
    next !== null &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    (next.startsWith("/classes") || next.startsWith("/clubs") || next.startsWith(portalPathFor(role)));
  return allowed ? next : portalPathFor(role);
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace(destinationFor(user.role));
  }, [user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const profile = await login(email, password);
      router.replace(destinationFor(profile.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถเข้าสู่ระบบได้");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-ash-100 px-5 py-16">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-64 bg-carbon-900"
        style={{
          backgroundImage:
            "radial-gradient(70% 100% at 80% 0%, rgba(230,27,35,0.45) 0%, transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-md animate-rise">
        <Link
          href="/"
          className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" /> กลับสู่หน้าแรก
        </Link>

        <div className="surface p-8">
          <Wordmark className="mb-7" />

          <h1 className="font-display text-2xl font-extrabold tracking-tight text-carbon-900">
            เข้าสู่ระบบสมาชิก
          </h1>
          <p className="mt-2 text-sm text-carbon-500">
            จัดการแพ็กเกจ จองเทรนเนอร์ และติดตามโปรแกรมฝึกของคุณ
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
            <Input
              label="อีเมล *"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@fitpulse.io"
            />
            <Input
              label="รหัสผ่าน *"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-ember-500/30 bg-ember-50 px-3 py-2.5 text-sm font-medium text-ember-600"
              >
                {error}
              </p>
            )}

            <Button type="submit" loading={submitting} className="w-full">
              <KeyRound className="size-4" /> เข้าสู่ระบบ
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-carbon-500">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="font-bold text-pulse-500 hover:text-pulse-600">
              สมัครสมาชิกออนไลน์
            </Link>
          </p>
        </div>

        {SHOW_DEMO_LOGIN && (
        <div className="surface mt-5 p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-pulse-500">
            บัญชีสำหรับทดลองใช้งาน
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-ash-300 bg-ash-50 px-3 py-2.5 text-left transition-colors hover:border-pulse-500 focus-pulse"
              >
                <span className="truncate text-sm text-carbon-700">{account.email}</span>
                <Badge tone="pulse">{account.role}</Badge>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-carbon-500">
            รหัสผ่านของทุกบัญชีทดลอง:{" "}
            <span className="font-mono font-semibold text-carbon-900">{DEMO_PASSWORD}</span>
          </p>
        </div>
        )}
      </div>
    </main>
  );
}
