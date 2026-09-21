"use client";

import { BadgeCheck, CalendarDays, Dumbbell, LayoutDashboard, Users } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal/portal-shell";

const NAV: NavItem[] = [
  { href: "/trainer", label: "วันนี้", icon: LayoutDashboard },
  { href: "/trainer/schedule", label: "ตารางสอน", icon: CalendarDays },
  { href: "/trainer/clients", label: "สมาชิกที่ดูแล", icon: Users },
  { href: "/trainer/programs", label: "ออกโปรแกรม", icon: Dumbbell },
  { href: "/trainer/profile", label: "โปรไฟล์โค้ช", icon: BadgeCheck },
];

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell role="TRAINER" nav={NAV} layout="top">
      {children}
    </PortalShell>
  );
}
