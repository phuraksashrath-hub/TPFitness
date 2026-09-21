"use client";

import { CalendarDays, CreditCard, LayoutDashboard, Layers, MapPin, UserCog, UserPlus, Users, Wrench } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal/portal-shell";

const NAV: NavItem[] = [
  { href: "/admin", label: "ภาพรวมระบบ", icon: LayoutDashboard },
  { href: "/admin/members", label: "จัดการสมาชิก", icon: Users },
  { href: "/admin/trainers", label: "บุคลากรเทรนเนอร์", icon: UserCog },
  { href: "/admin/classes", label: "คลาสกรุ๊ป", icon: CalendarDays },
  { href: "/admin/branches", label: "สาขาและคลับ", icon: MapPin },
  { href: "/admin/equipment", label: "ทะเบียนอุปกรณ์", icon: Layers },
  { href: "/admin/maintenance", label: "งานซ่อมบำรุง", icon: Wrench },
  { href: "/admin/plans", label: "แพ็กเกจ & รายได้", icon: CreditCard },
  { href: "/admin/leads", label: "ผู้สนใจทดลองเล่น", icon: UserPlus },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell role="ADMIN" nav={NAV} layout="rail">
      {children}
    </PortalShell>
  );
}
