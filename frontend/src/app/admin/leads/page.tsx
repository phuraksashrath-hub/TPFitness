"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Phone, UserPlus } from "lucide-react";
import { leadApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import type { LeadStatus, TrialLead } from "@/lib/types";
import { formatDateTime, relativeFromNow } from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { Card, EmptyState } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const TIME_LABELS: Record<string, string> = {
  MORNING: "เช้า (06:00–11:00)",
  AFTERNOON: "บ่าย (11:00–16:00)",
  EVENING: "เย็น (16:00–20:00)",
  LATE: "ค่ำ (20:00–22:00)",
};

const FILTERS: [LeadStatus | "ALL", string][] = [
  ["ALL", "ทั้งหมด"],
  ["NEW", "ใหม่"],
  ["CONTACTED", "ติดต่อแล้ว"],
];

export default function AdminLeadsPage() {
  const toast = useToast();
  const [leads, setLeads] = useState<TrialLead[] | null>(null);
  const [filter, setFilter] = useState<LeadStatus | "ALL">("ALL");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLeads(await leadApi.list(filter === "ALL" ? undefined : filter));
    } catch (err) {
      setLeads([]);
      toast.error(apiErrorMessage(err, "ไม่สามารถโหลดรายชื่อผู้สนใจได้"));
    }
  }, [filter, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(lead: TrialLead, status: LeadStatus) {
    setBusyId(lead.id);
    try {
      await leadApi.setStatus(lead.id, status);
      toast.success(status === "CONTACTED" ? `บันทึกว่าติดต่อ ${lead.fullName} แล้ว` : "ย้ายกลับเป็นรายการใหม่แล้ว");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถอัปเดตสถานะได้"));
    } finally {
      setBusyId(null);
    }
  }

  const newCount = leads?.filter((l) => l.status === "NEW").length ?? 0;

  return (
    <>
      <PageHeading
        eyebrow="3-Day Free Pass"
        title="ผู้สนใจทดลองเล่นฟรี"
        description="รายชื่อที่ส่งฟอร์มจากหน้าเว็บไซต์ ติดต่อกลับแล้วทำเครื่องหมายไว้เพื่อไม่ให้โทรซ้ำ"
        action={
          leads && newCount > 0 ? <Badge tone="solid">{newCount} รายการใหม่</Badge> : undefined
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={cn(
              "min-h-10 rounded-full border px-4 py-1.5 text-xs font-bold transition-colors focus-pulse",
              filter === value
                ? "border-pulse-500 bg-pulse-500 text-white"
                : "border-ash-300 bg-white text-carbon-500 hover:border-ash-500",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {!leads && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {leads?.length === 0 && (
        <EmptyState
          icon={<UserPlus className="size-7" />}
          title="ยังไม่มีผู้สนใจ"
          description="เมื่อมีคนส่งฟอร์มทดลองเล่นฟรีจากหน้าแรก รายชื่อจะปรากฏที่นี่"
        />
      )}

      {leads && leads.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[50rem] text-left text-sm">
              <thead className="bg-ash-200 text-[11px] font-bold uppercase tracking-wider text-carbon-500">
                <tr>
                  <th className="px-5 py-3.5">ชื่อ</th>
                  <th className="px-5 py-3.5">ช่องทางติดต่อ</th>
                  <th className="px-5 py-3.5">ช่วงเวลาที่สะดวก</th>
                  <th className="px-5 py-3.5">ส่งเมื่อ</th>
                  <th className="px-5 py-3.5">สถานะ</th>
                  <th className="px-5 py-3.5 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ash-300">
                {leads.map((lead) => (
                  <tr key={lead.id} className={cn("align-top", lead.status === "NEW" && "bg-pulse-50/40")}>
                    <td className="px-5 py-4 font-display font-bold text-carbon-900">{lead.fullName}</td>
                    <td className="space-y-1 px-5 py-4 text-carbon-700">
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 font-semibold hover:text-pulse-600">
                        <Phone className="size-3.5 text-pulse-500" /> {lead.phone}
                      </a>
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-xs hover:text-pulse-600">
                          <Mail className="size-3.5 text-ash-600" /> {lead.email}
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-carbon-700">
                      {lead.preferredTime ? (TIME_LABELS[lead.preferredTime] ?? lead.preferredTime) : "ไม่ระบุ"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-carbon-700">
                      <p>{formatDateTime(lead.createdAt)}</p>
                      <p className="text-xs text-carbon-500">{relativeFromNow(lead.createdAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={lead.status === "NEW" ? "glow" : "jade"}>
                        {lead.status === "NEW" ? "ใหม่" : "ติดต่อแล้ว"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {lead.status === "NEW" ? (
                        <Button
                          size="sm"
                          loading={busyId === lead.id}
                          onClick={() => void setStatus(lead, "CONTACTED")}
                        >
                          ติดต่อแล้ว
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busyId === lead.id}
                          onClick={() => void setStatus(lead, "NEW")}
                        >
                          ย้ายกลับเป็นใหม่
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
