"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ShieldX, Wrench } from "lucide-react";
import { maintenanceApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { MaintenanceRequest, MaintenanceStatus } from "@/lib/types";
import { formatDateTime, formatTHB, relativeFromNow } from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { Card, CardBody, EmptyState } from "@/components/ui/card";
import { Skeleton, StatCard } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const FILTERS: [MaintenanceStatus | "ALL", string][] = [
  ["ALL", "ทั้งหมด"],
  ["OPEN", "รอตรวจสอบ"],
  ["IN_PROGRESS", "กำลังดำเนินการ"],
  ["RESOLVED", "ซ่อมเสร็จแล้ว"],
  ["REJECTED", "ปฏิเสธ"],
];

export default function AdminMaintenancePage() {
  const toast = useToast();
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[] | null>(null);
  const [filter, setFilter] = useState<MaintenanceStatus | "ALL">("ALL");
  const [resolving, setResolving] = useState<MaintenanceRequest | null>(null);
  const [resolution, setResolution] = useState({ notes: "", cost: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setRequests(await maintenanceApi.list(filter === "ALL" ? undefined : filter));
    } catch (err) {
      setRequests([]);
      toast.error(apiErrorMessage(err, "ไม่สามารถโหลดคิวงานซ่อมบำรุงได้"));
    }
  }, [filter, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function claim(request: MaintenanceRequest) {
    if (!user) return;
    try {
      await maintenanceApi.assign(request.id, user.id);
      toast.success(`มอบหมายงานให้คุณแล้ว อุปกรณ์ ${request.equipmentName} ถูกปิดใช้งานชั่วคราว`);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถมอบหมายงานได้"));
    }
  }

  async function reject(request: MaintenanceRequest) {
    try {
      await maintenanceApi.reject(request.id, "ตรวจสอบแล้ว — ไม่พบความผิดปกติ");
      toast.success("ปฏิเสธคำขอแล้ว");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถปฏิเสธคำขอได้"));
    }
  }

  async function resolve() {
    if (!resolving) return;
    setSaving(true);
    try {
      await maintenanceApi.resolve(
        resolving.id,
        resolution.notes.trim() || undefined,
        resolution.cost ? Number(resolution.cost) : undefined,
      );
      toast.success("ปิดงานซ่อมแล้ว อุปกรณ์กลับมาพร้อมใช้งาน");
      setResolving(null);
      setResolution({ notes: "", cost: "" });
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถปิดงานซ่อมได้"));
    } finally {
      setSaving(false);
    }
  }

  const counts = {
    open: requests?.filter((r) => r.status === "OPEN").length ?? 0,
    inProgress: requests?.filter((r) => r.status === "IN_PROGRESS").length ?? 0,
    resolved: requests?.filter((r) => r.status === "RESOLVED").length ?? 0,
    cost: requests?.reduce((sum, r) => sum + (r.repairCost ?? 0), 0) ?? 0,
  };

  return (
    <>
      <PageHeading
        eyebrow="ISO 9001 Standard"
        title="การตรวจสอบอุปกรณ์และบันทึกซ่อมบำรุง"
        description="คัดกรองคำขอแจ้งซ่อม มอบหมายผู้รับผิดชอบ และปิดงานพร้อมบันทึกค่าซ่อม"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="รอตรวจสอบ"
          value={counts.open}
          tone="ember"
          icon={<Wrench className="size-4" />}
        />
        <StatCard label="กำลังดำเนินการ" value={counts.inProgress} />
        <StatCard label="ซ่อมเสร็จแล้ว" value={counts.resolved} tone="jade" />
        <StatCard label="ค่าซ่อมรวม" value={formatTHB(counts.cost)} tone="carbon" />
      </div>

      <div className="my-6 flex flex-wrap gap-2">
        {FILTERS.map(([status, label]) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            aria-pressed={filter === status}
            className={cn(
              "min-h-10 rounded-full border px-4 py-1.5 text-xs font-bold transition-colors focus-pulse",
              filter === status
                ? "border-pulse-500 bg-pulse-500 text-white"
                : "border-ash-300 bg-white text-carbon-500 hover:border-ash-500",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {!requests && <Skeleton className="h-80" />}

      {requests?.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 className="size-7" />}
          title="คิวงานว่าง"
          description="ไม่มีคำขอแจ้งซ่อมที่ตรงกับตัวกรองนี้"
        />
      )}

      <div className="space-y-4">
        {requests?.map((request) => (
          <Card key={request.id}>
            <CardBody className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusBadge value={request.priority} />
                  <StatusBadge value={request.status} />
                  <span className="text-xs text-carbon-500">
                    แจ้ง {relativeFromNow(request.reportedAt)} โดย {request.reportedByName}
                  </span>
                </div>

                <h3 className="mt-3 font-display text-lg font-bold text-carbon-900">
                  {request.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-carbon-500">
                  {request.description}
                </p>

                <dl className="mt-4 grid gap-x-8 gap-y-2 text-xs sm:grid-cols-2">
                  <div className="flex justify-between gap-3 sm:justify-start sm:gap-2">
                    <dt className="text-carbon-500">อุปกรณ์</dt>
                    <dd className="font-semibold text-carbon-900">
                      {request.equipmentName}
                      {request.equipmentLocation ? ` · ${request.equipmentLocation}` : ""}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 sm:justify-start sm:gap-2">
                    <dt className="text-carbon-500">ผู้รับผิดชอบ</dt>
                    <dd className="font-semibold text-carbon-900">
                      {request.assignedToName ?? "ยังไม่มอบหมาย"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 sm:justify-start sm:gap-2">
                    <dt className="text-carbon-500">เวลาแจ้ง</dt>
                    <dd className="font-semibold text-carbon-900">
                      {formatDateTime(request.reportedAt)}
                    </dd>
                  </div>
                  {request.resolvedAt && (
                    <div className="flex justify-between gap-3 sm:justify-start sm:gap-2">
                      <dt className="text-carbon-500">ปิดงานเมื่อ</dt>
                      <dd className="font-semibold text-carbon-900">
                        {formatDateTime(request.resolvedAt)}
                      </dd>
                    </div>
                  )}
                </dl>

                {request.resolutionNotes && (
                  <p className="mt-4 rounded-lg border border-jade-400/40 bg-jade-50 px-3.5 py-2.5 text-sm text-carbon-700">
                    {request.resolutionNotes}
                    {request.repairCost != null && (
                      <span className="ml-2 font-semibold text-jade-600">
                        ({formatTHB(request.repairCost)})
                      </span>
                    )}
                  </p>
                )}
              </div>

              {(request.status === "OPEN" || request.status === "IN_PROGRESS") && (
                <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">
                  {request.status === "OPEN" && (
                    <Button variant="outline" size="sm" onClick={() => void claim(request)}>
                      มอบหมายให้ตัวเอง
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setResolving(request)}>
                    <CheckCircle2 className="size-3.5" /> ปิดงานซ่อม
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => void reject(request)}>
                    <ShieldX className="size-3.5" /> ปฏิเสธ
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        open={Boolean(resolving)}
        onClose={() => setResolving(null)}
        title="ปิดคำขอแจ้งซ่อม"
        description={resolving?.equipmentName}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResolving(null)}>
              ยกเลิก
            </Button>
            <Button loading={saving} onClick={() => void resolve()}>
              ยืนยันซ่อมเสร็จ
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="บันทึกการซ่อม"
            value={resolution.notes}
            onChange={(e) => setResolution({ ...resolution, notes: e.target.value })}
            placeholder="เปลี่ยนสายพานและปรับความตึงใหม่ ทดสอบที่ 18 กม./ชม. เป็นเวลา 10 นาที"
          />
          <Input
            label="ค่าซ่อม (บาท)"
            type="number"
            min={0}
            value={resolution.cost}
            onChange={(e) => setResolution({ ...resolution, cost: e.target.value })}
            placeholder="4500"
            hint="เมื่อปิดงาน อุปกรณ์จะกลับสู่สถานะพร้อมใช้งานโดยอัตโนมัติ"
          />
        </div>
      </Modal>
    </>
  );
}
