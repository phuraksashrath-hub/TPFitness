"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUp, Mail, MapPin, Menu, Phone, User, X } from "lucide-react";
import { useAuth, portalPathFor } from "@/lib/auth-context";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "หน้าแรก" },
  { href: "/clubs", label: "คลับ" },
  { href: "/classes", label: "คลาส" },
  { href: "/#membership", label: "สมาชิก" },
  { href: "/#coaches", label: "เทรนเนอร์" },
  { href: "/#platform", label: "บริหารจัดการ Admin" },
];

export function Wordmark({
  className,
  tone = "carbon",
}: {
  className?: string;
  tone?: "carbon" | "light";
}) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/tp-mark.png" alt="" className="size-10 shrink-0 rounded-lg" width={40} height={40} />
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-lg font-extrabold italic tracking-tight",
            tone === "light" ? "text-white" : "text-carbon-900",
          )}
        >
          <span className="text-pulse-500">TP</span> FITNESS
        </span>
        <span
          className={cn(
            "mt-0.5 block text-[9px] font-bold uppercase tracking-[0.22em]",
            tone === "light" ? "text-ash-500" : "text-carbon-500",
          )}
        >
          24 Hour Performance
        </span>
      </span>
    </Link>
  );
}

/** Thin carbon utility strip pinned above the main navigation. */
export function UtilityBar() {
  return (
    <div className="hidden bg-carbon-900 text-white md:block">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-6 px-5 text-xs sm:px-8">
        <p className="flex items-center gap-2.5">
          <span className="rounded-sm bg-pulse-500 px-2 py-0.5 text-[11px] font-bold tracking-[0.08em]">
            24/7 OPEN
          </span>
          <span className="text-ash-500">เข้าใช้งานได้ตลอด 24 ชั่วโมง ทุกวัน ไม่เว้นวันหยุดราชการ</span>
        </p>
        <p className="flex items-center gap-5 text-ash-500">
          <a href="tel:020123456" className="flex items-center gap-1.5 hover:text-white">
            <Phone className="size-3.5" /> Hotline: 02-012-3456
          </a>
          <a href="/clubs" className="hidden hover:text-white lg:inline">
            ค้นหาสาขาใกล้คุณ
          </a>
        </p>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <UtilityBar />

      <div
        className={cn(
          "border-b bg-white transition-shadow duration-300",
          scrolled ? "border-ash-300 shadow-card" : "border-transparent",
        )}
      >
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Wordmark />
          </div>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[15px] font-semibold text-carbon-700 transition-colors hover:text-pulse-500"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <LinkButton href={portalPathFor(user.role)} size="sm">
                เข้าสู่พอร์ทัล
              </LinkButton>
            ) : (
              <>
                <LinkButton href="/register" size="sm">
                  สมัครสมาชิก
                </LinkButton>
                <Link
                  href="/login"
                  aria-label="เข้าสู่ระบบ"
                  className="grid size-10 place-items-center rounded-full bg-pulse-500 text-white transition-colors hover:bg-pulse-600 focus-pulse"
                >
                  <User className="size-5" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-carbon-900 transition-colors hover:bg-ash-200 focus-pulse lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-ash-300 bg-white px-5 py-5 lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-carbon-700 transition-colors hover:bg-ash-100 hover:text-pulse-500"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2.5">
              {user ? (
                <LinkButton href={portalPathFor(user.role)}>เข้าสู่พอร์ทัล</LinkButton>
              ) : (
                <>
                  <LinkButton href="/register">สมัครสมาชิก</LinkButton>
                  <LinkButton href="/login" variant="outline">
                    เข้าสู่ระบบ
                  </LinkButton>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-carbon-900 text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Wordmark tone="light" />
            <p className="mt-4 font-display text-2xl font-extrabold italic leading-tight text-pulse-500">
              24 HOUR
              <br />
              PERFORMANCE
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ash-500">
              ฟิตเนสระดับพรีเมียมเปิดตลอด 24 ชม. ด้วยอุปกรณ์มาตรฐานสากลและเทรนเนอร์ผู้เชี่ยวชาญ
              เพื่อผลลัพธ์ที่ดีที่สุดสำหรับคุณ
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-jade-400">
              <span className="size-2 rounded-full bg-jade-400" /> เปิดให้บริการแล้ว 42 คลับทั่วประเทศ
            </p>
          </div>

          <div>
            <p className="mb-4 font-display text-base font-bold">คลับและบริการ</p>
            <ul className="space-y-2.5 text-sm text-ash-500">
              <li>
                <a className="transition-colors hover:text-white" href="/clubs">
                  ค้นหาสาขาใกล้คุณ
                </a>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/#membership">
                  แพ็กเกจสมาชิกรายเดือนและรายปี
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/#coaches">
                  Personal Trainer &amp; คลาสออกกำลังกาย
                </Link>
              </li>
              <li>
                <a className="transition-colors hover:text-white" href="/clubs">
                  สิ่งอำนวยความสะดวกในคลับ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 font-display text-base font-bold">สมาชิก &amp; ความช่วยเหลือ</p>
            <ul className="space-y-2.5 text-sm text-ash-500">
              <li>
                <Link className="transition-colors hover:text-white" href="/register">
                  ลงทะเบียนสมาชิกออนไลน์
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/login">
                  เข้าสู่ระบบสมาชิก TP Fitness
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/admin">
                  ระบบบริหารจัดการ Admin
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/#platform">
                  สถาปัตยกรรมของแพลตฟอร์ม
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 font-display text-base font-bold">ติดต่อ 24 ชั่วโมง</p>
            <ul className="space-y-3 text-sm text-ash-500">
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-pulse-500" /> 02-012-3456
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-pulse-500" /> support@tpfitness.co.th
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 text-pulse-500" /> สำนักงานใหญ่ กรุงเทพมหานคร
              </li>
            </ul>
            <LinkButton href="/#trial" className="mt-5 w-full">
              ทดลองเล่นฟรี 3 วัน
            </LinkButton>
          </div>
        </div>
      </div>

      <div className="border-t border-carbon-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-ash-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} TP Fitness Co., Ltd. All rights reserved.</p>
          <p className="flex flex-wrap gap-5">
            <span>ข้อตกลงการให้บริการ</span>
            <span>นโยบายคุ้มครองข้อมูลส่วนบุคคล</span>
            <span>ความปลอดภัย 24/7</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Fixed capsule trigger described in the Kinetic Pulse component spec. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="กลับขึ้นด้านบน"
      className="fixed bottom-6 right-6 z-50 grid size-13 place-items-center rounded-full bg-pulse-500 text-white shadow-pulse transition-transform hover:scale-105 focus-pulse"
    >
      <ArrowUp className="size-5" />
      <span className="text-[9px] font-bold tracking-[0.08em]">TOP</span>
    </button>
  );
}
