"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, LogOut, Menu, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";
import { SiteFooter, UtilityBar, Wordmark } from "@/components/landing/site-chrome";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  TRAINER: "เทรนเนอร์",
  MEMBER: "สมาชิก",
};

export function PortalShell({
  role,
  nav,
  layout = "top",
  children,
}: {
  role: UserRole;
  nav: NavItem[];
  /** "rail" renders the carbon admin console rail, "top" the member/trainer club navigation. */
  layout?: "rail" | "top";
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace(
        user.role === "ADMIN" ? "/admin" : user.role === "TRAINER" ? "/trainer" : "/member",
      );
    }
  }, [isLoading, user, role, router]);

  useEffect(() => setMenuOpen(false), [pathname]);

  if (isLoading || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center px-6">
        <div className="w-full max-w-5xl space-y-4">
          <Skeleton className="h-10 w-56" />
          <div className="grid gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (layout === "rail") {
    return (
      <div className="flex min-h-screen flex-1 bg-ash-100">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-carbon-900 px-5 py-6 lg:flex">
          <div>
            <Wordmark tone="light" />
            <p className="mt-3 font-display text-lg font-extrabold italic tracking-tight text-pulse-500">
              ADMIN CORE
            </p>
          </div>

          <nav className="mt-9 flex-1 space-y-1.5">
            {nav.map((item) => (
              <RailLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </nav>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-carbon-800 p-3.5">
              <Avatar name={user.fullName} src={user.avatarUrl} size={38} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
                <p className="truncate text-xs text-ash-600">{user.email}</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-carbon-800 px-4 py-2.5 text-sm font-semibold text-ash-500 transition-colors hover:bg-carbon-700 hover:text-white focus-pulse"
            >
              <ArrowLeft className="size-4" /> กลับสู่หน้าเว็บไซต์
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-carbon-700 px-4 py-2.5 text-sm font-semibold text-ash-600 transition-colors hover:border-pulse-500 hover:text-pulse-300 focus-pulse"
            >
              <LogOut className="size-4" /> ออกจากระบบ
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-40 hidden items-center justify-between gap-4 border-b border-ash-300 bg-white px-8 py-3 lg:flex">
            <div className="flex items-center gap-3">
              <Badge tone="jade">24H Network Live</Badge>
              <span className="text-sm text-carbon-500">ระบบตรวจเช็กการเข้า-ออกคลับออนไลน์</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/maintenance"
                aria-label="งานซ่อมบำรุง"
                className="rounded-full border border-ash-300 p-2 text-carbon-500 transition-colors hover:border-pulse-500 hover:text-pulse-500 focus-pulse"
              >
                <Bell className="size-4" />
              </Link>
              <div className="flex items-center gap-2.5">
                <Avatar name={user.fullName} src={user.avatarUrl} size={34} />
                <span className="text-sm font-semibold text-carbon-900">{user.fullName}</span>
              </div>
            </div>
          </div>

          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-carbon-900 px-5 py-3.5 lg:hidden">
            <Wordmark tone="light" />
            <div className="flex items-center gap-2">
              <Badge tone="solid">{ROLE_LABELS[role]}</Badge>
              <button
                type="button"
                aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-lg p-2 text-white transition-colors hover:bg-carbon-800 focus-pulse"
              >
                {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </header>

          {menuOpen && (
            <div className="bg-carbon-900 px-4 pb-4 lg:hidden">
              <nav className="space-y-1.5">
                {nav.map((item) => (
                  <RailLink key={item.href} item={item} active={isActive(pathname, item.href)} />
                ))}
              </nav>
              <button
                type="button"
                onClick={logout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-carbon-700 px-4 py-2.5 text-sm font-semibold text-ash-600"
              >
                <LogOut className="size-4" /> ออกจากระบบ
              </button>
            </div>
          )}

          <main className="flex-1 px-5 py-7 sm:px-8 sm:py-9">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-ash-50">
      <UtilityBar />

      <header className="sticky top-0 z-40 border-b border-ash-300 bg-white">
        <div className="mx-auto flex h-17 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Wordmark />

          <nav className="hidden items-center gap-1.5 lg:flex">
            {nav.map((item) => (
              <TabLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-carbon-900">{user.fullName}</p>
              <p className="text-xs text-carbon-500">{ROLE_LABELS[role]}</p>
            </div>
            <Avatar name={user.fullName} src={user.avatarUrl} size={38} />
            <button
              type="button"
              onClick={logout}
              aria-label="ออกจากระบบ"
              className="hidden rounded-full border border-ash-300 p-2.5 text-carbon-500 transition-colors hover:border-pulse-500 hover:text-pulse-500 focus-pulse sm:block"
            >
              <LogOut className="size-4" />
            </button>
            <button
              type="button"
              aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg p-2 text-carbon-900 transition-colors hover:bg-ash-200 focus-pulse lg:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-ash-300 bg-white px-4 py-4 lg:hidden">
            <nav className="space-y-1">
              {nav.map((item) => (
                <TabLink
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item.href)}
                  block
                />
              ))}
            </nav>
            <button
              type="button"
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-ash-300 px-4 py-2.5 text-sm font-semibold text-carbon-500"
            >
              <LogOut className="size-4" /> ออกจากระบบ
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8">{children}</main>

      <SiteFooter />
    </div>
  );
}

function isActive(pathname: string, href: string) {
  return href === pathname || (href !== "/" && pathname.startsWith(`${href}/`));
}

function RailLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-pulse",
        active
          ? "bg-pulse-500 text-white"
          : "text-ash-500 hover:bg-carbon-800 hover:text-white",
      )}
    >
      <Icon className="size-4.5 shrink-0" />
      {item.label}
    </Link>
  );
}

function TabLink({ item, active, block }: { item: NavItem; active: boolean; block?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors focus-pulse",
        block && "w-full",
        active ? "bg-pulse-50 text-pulse-600" : "text-carbon-700 hover:bg-ash-100",
      )}
    >
      <Icon className={cn("size-4", active ? "text-pulse-500" : "text-ash-600")} />
      {item.label}
    </Link>
  );
}

/**
 * The angled red identity band that opens the member and trainer portals in the
 * stitch designs. Pass stat chips through `aside`.
 */
export function IdentityBand({
  eyebrow,
  title,
  subtitle,
  avatar,
  badges,
  aside,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  avatar?: React.ReactNode;
  badges?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="kinetic-band kinetic-grid relative mb-8 overflow-hidden rounded-2xl px-6 py-7 text-white shadow-pulse sm:px-8">
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          {avatar}
          <div className="min-w-0">
            {badges && <div className="mb-2 flex flex-wrap items-center gap-2">{badges}</div>}
            {eyebrow && (
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                {eyebrow}
              </p>
            )}
            <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-tight sm:text-[34px]">
              {title}
            </h1>
            {subtitle && <p className="mt-1.5 text-sm text-white/85">{subtitle}</p>}
          </div>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </section>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="slash mb-2 text-xs font-bold uppercase tracking-[0.14em] text-pulse-500">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-carbon-900 sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-carbon-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
