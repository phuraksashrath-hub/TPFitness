"use client";

import { useEffect, useState } from "react";
import { Target, Users } from "lucide-react";
import { dashboardApi } from "@/lib/services";
import type { ClientSummary } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { Card, CardBody, EmptyState } from "@/components/ui/card";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";

export default function TrainerClientsPage() {
  const [clients, setClients] = useState<ClientSummary[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dashboardApi
      .trainer()
      .then((d) => setClients(d.clients))
      .catch(() => setClients([]));
  }, []);

  const filtered = (clients ?? []).filter((c) =>
    c.fullName.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <>
      <PageHeading
        eyebrow="Assigned active members"
        title="สมาชิกในความดูแล"
        description="รายชื่อสมาชิกทุกคนที่เคยฝึกกับคุณ พร้อมเป้าหมายหลักและนัดหมายครั้งถัดไป"
        action={
          <div className="w-full sm:w-72">
            <Input
              placeholder="ค้นหาชื่อ, สมาชิก ID หรือเป้าหมาย…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="ค้นหาสมาชิก"
            />
          </div>
        }
      />

      {!clients && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      )}

      {clients && filtered.length === 0 && (
        <EmptyState
          icon={<Users className="size-7" />}
          title="ยังไม่มีสมาชิกในความดูแล"
          description="เมื่อมีสมาชิกจองเซสชันกับคุณ รายชื่อจะปรากฏที่นี่โดยอัตโนมัติ"
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((client) => (
          <Card
            key={client.memberId}
            className="p-6 transition-all duration-200 hover:border-pulse-500 hover:shadow-pulse"
          >
            <div className="flex items-center gap-3.5">
              <Avatar name={client.fullName} src={client.avatarUrl} size={50} />
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold text-carbon-900">
                  {client.fullName}
                </p>
                <p className="text-xs text-carbon-500">
                  ID: #FP-{client.memberId.toString().padStart(5, "0")} · ฝึกร่วมกัน{" "}
                  {client.totalSessions} ครั้ง
                </p>
              </div>
            </div>

            {client.fitnessGoal && (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-ash-300 bg-ash-50 px-3 py-2.5 text-sm text-carbon-700">
                <Target className="mt-0.5 size-3.5 shrink-0 text-pulse-500" />
                {client.fitnessGoal}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-ash-300 pt-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-carbon-500">
                  นัดหมายครั้งถัดไป
                </p>
                <p className="mt-0.5 text-sm font-semibold text-carbon-900">
                  {client.nextSessionAt ? formatDateTime(client.nextSessionAt) : "ยังไม่ได้จอง"}
                </p>
              </div>
              <Badge tone={client.activePrograms > 0 ? "pulse" : "ash"}>
                {client.activePrograms} โปรแกรม
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {clients && clients.length > 0 && (
        <Card className="mt-6">
          <CardBody>
            <p className="text-sm text-carbon-500">
              แสดง {filtered.length} จากทั้งหมด {clients.length} คน
            </p>
          </CardBody>
        </Card>
      )}
    </>
  );
}
