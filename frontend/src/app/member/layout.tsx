"use client";

import { CalendarDays, CalendarPlus, CreditCard, Dumbbell, LayoutDashboard, UserRound } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal/portal-shell";

const NAV: NavItem[] = [
  { href: "/member", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/member/booking", label: "จองเซสชัน", icon: CalendarPlus },
  { href: "/member/classes", label: "คลาสกรุ๊ป", icon: CalendarDays },
  { href: "/member/membership", label: "แพ็กเกจสมาชิก", icon: CreditCard },
  { href: "/member/programs", label: "โปรแกรมฝึก", icon: Dumbbell },
  { href: "/member/profile", label: "โปรไฟล์", icon: UserRound },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell role="MEMBER" nav={NAV} layout="top">
      {children}
    </PortalShell>
  );
}
