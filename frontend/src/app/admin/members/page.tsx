"use client";

import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { memberApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import type { UserProfile, UserStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { Card, CardBody, EmptyState } from "@/components/ui/card";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export default function AdminMembersPage() {
  const toast = useToast();
  const [members, setMembers] = useState<UserProfile[] | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setMembers(await memberApi.list(search || undefined));
    } catch (err) {
      setMembers([]);
      toast.error(apiErrorMessage(err, "ไม่สามารถโหลดรายชื่อสมาชิกได้"));
    }
  }, [search, toast]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function setStatus(member: UserProfile, status: UserStatus) {
    try {
      await memberApi.setStatus(member.id, status);
      toast.success(`อัปเดตสถานะของ ${member.fullName} เรียบร้อยแล้ว`);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถอัปเดตข้อมูลสมาชิกได้"));
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Member Directory"
        title="จัดการสมาชิก"
        description="การระงับสิทธิ์บัญชีจะปิดกั้นการจองครั้งใหม่ทันที"
        action={
          <div className="w-full sm:w-72">
            <Input
              placeholder="ค้นหาจากชื่อหรืออีเมล…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="ค้นหาสมาชิก"
            />
          </div>
        }
      />

      {!members && <Skeleton className="h-96" />}

      {members?.length === 0 && (
        <EmptyState
          icon={<Users className="size-7" />}
          title="ไม่พบสมาชิก"
          description="ลองค้นหาด้วยคำอื่น"
        />
      )}

      {members && members.length > 0 && (
        <Card className="overflow-hidden">
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-ash-300 bg-ash-100 text-xs font-bold uppercase tracking-wider text-carbon-500">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    สมาชิก
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    ช่องทางติดต่อ
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    วันที่สมัคร
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    สถานะ
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    ดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-ash-200 last:border-0 hover:bg-pulse-50/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.fullName} src={member.avatarUrl} size={36} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-carbon-900">{member.fullName}</p>
                          <p className="truncate text-xs text-carbon-500">
                            ID: #FP-{member.id.toString().padStart(5, "0")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-carbon-500">
                      <p className="truncate">{member.email}</p>
                      <p className="text-xs">{member.phoneNumber ?? "—"}</p>
                    </td>
                    <td className="px-6 py-4 text-carbon-500">{formatDate(member.createdAt)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge value={member.status} />
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        aria-label={`เปลี่ยนสถานะของ ${member.fullName}`}
                        value={member.status}
                        onChange={(e) => void setStatus(member, e.target.value as UserStatus)}
                        className="w-40"
                      >
                        {(
                          [
                            ["ACTIVE", "ใช้งานอยู่"],
                            ["INACTIVE", "ไม่ใช้งาน"],
                            ["SUSPENDED", "ระงับสิทธิ์"],
                          ] as [UserStatus, string][]
                        ).map(([status, label]) => (
                          <option key={status} value={status}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </>
  );
}
