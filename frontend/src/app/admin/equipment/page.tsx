"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers, Plus, Wrench } from "lucide-react";
import { equipmentApi, maintenanceApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import type { Equipment, EquipmentStatus, MaintenancePriority } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { Card, EmptyState } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const STATUSES: [EquipmentStatus | "ALL", string][] = [
  ["ALL", "ทั้งหมด"],
  ["AVAILABLE", "พร้อมใช้งาน"],
  ["IN_USE", "กำลังใช้งาน"],
  ["UNDER_MAINTENANCE", "ซ่อมบำรุง"],
  ["RETIRED", "ปลดระวาง"],
];

const CATEGORIES: [string, string][] = [
  ["CARDIO", "คาร์ดิโอ"],
  ["STRENGTH", "เวทเทรนนิ่ง"],
  ["CONDITIONING", "Conditioning"],
  ["FUNCTIONAL", "Functional"],
  ["RECOVERY", "ฟื้นฟูร่างกาย"],
];

const STATUS_OPTIONS: [EquipmentStatus, string][] = [
  ["AVAILABLE", "พร้อมใช้งาน"],
  ["IN_USE", "กำลังใช้งาน"],
  ["UNDER_MAINTENANCE", "อยู่ระหว่างซ่อมบำรุง"],
  ["RETIRED", "ปลดระวาง"],
];

export default function AdminEquipmentPage() {
  const toast = useToast();
  const [items, setItems] = useState<Equipment[] | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<EquipmentStatus | "ALL">("ALL");

  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    serialNumber: "",
    category: "CARDIO",
    brand: "",
    location: "",
  });

  const [reportTarget, setReportTarget] = useState<Equipment | null>(null);
  const [issue, setIssue] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as MaintenancePriority,
  });

  const load = useCallback(async () => {
    try {
      setItems(await equipmentApi.list(search || undefined, filter === "ALL" ? undefined : filter));
    } catch (err) {
      setItems([]);
      toast.error(apiErrorMessage(err, "ไม่สามารถโหลดรายการอุปกรณ์ได้"));
    }
  }, [search, filter, toast]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function createEquipment() {
    if (!form.name.trim() || !form.serialNumber.trim()) {
      toast.error("กรุณาระบุชื่ออุปกรณ์และหมายเลขเครื่อง");
      return;
    }
    setSaving(true);
    try {
      await equipmentApi.create({
        name: form.name.trim(),
        serialNumber: form.serialNumber.trim(),
        category: form.category,
        brand: form.brand.trim() || undefined,
        location: form.location.trim() || undefined,
      });
      toast.success("เพิ่มอุปกรณ์เข้าทะเบียนเรียบร้อยแล้ว");
      setAddOpen(false);
      setForm({ name: "", serialNumber: "", category: "CARDIO", brand: "", location: "" });
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถเพิ่มอุปกรณ์ได้"));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(item: Equipment, status: EquipmentStatus) {
    try {
      await equipmentApi.setStatus(item.id, status);
      toast.success(`อัปเดตสถานะของ ${item.name} เรียบร้อยแล้ว`);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถอัปเดตสถานะได้"));
    }
  }

  async function submitIssue() {
    if (!reportTarget || !issue.title.trim() || !issue.description.trim()) {
      toast.error("กรุณาระบุอาการขัดข้องก่อนส่งคำขอ");
      return;
    }
    setSaving(true);
    try {
      await maintenanceApi.report({
        equipmentId: reportTarget.id,
        title: issue.title.trim(),
        description: issue.description.trim(),
        priority: issue.priority,
      });
      toast.success("บันทึกคำขอแจ้งซ่อมเรียบร้อยแล้ว");
      setReportTarget(null);
      setIssue({ title: "", description: "", priority: "MEDIUM" });
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถบันทึกคำขอได้"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Asset Register"
        title="ทะเบียนอุปกรณ์ออกกำลังกาย"
        description="เครื่องทุกตัวในคลับ พร้อมหมายเลขเครื่อง โซนประจำจุด และประวัติการบำรุงรักษา"
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> เพิ่มอุปกรณ์
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="sm:w-80">
          <Input
            placeholder="ค้นหา รหัสเครื่องเล่น, โซน…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="ค้นหาอุปกรณ์"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(([status, label]) => (
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
      </div>

      {!items && (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {items?.length === 0 && (
        <EmptyState
          icon={<Layers className="size-7" />}
          title="ไม่พบอุปกรณ์ที่ตรงเงื่อนไข"
          description="ลองปรับตัวกรอง หรือลงทะเบียนเครื่องใหม่"
        />
      )}

      {items && items.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="bg-ash-200 text-[11px] font-bold uppercase tracking-wider text-carbon-500">
                <tr>
                  <th className="px-5 py-3.5">รหัสครุภัณฑ์ (Asset ID)</th>
                  <th className="px-5 py-3.5">รายการเครื่องเล่น / ยี่ห้อ</th>
                  <th className="px-5 py-3.5">โซนประจำจุด</th>
                  <th className="px-5 py-3.5">รอบตรวจล่าสุด</th>
                  <th className="px-5 py-3.5">สถานะการทำงาน</th>
                  <th className="px-5 py-3.5">ระดับความเร่งด่วน</th>
                  <th className="px-5 py-3.5 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ash-300">
                {items.map((item) => {
                  const down = item.status === "UNDER_MAINTENANCE";
                  return (
                    <tr key={item.id} className={cn("align-top", down && "bg-pulse-50/60")}>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-bold text-pulse-600">
                        #{item.serialNumber}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-display font-bold text-carbon-900">{item.name}</p>
                        <p className="text-xs text-carbon-500">
                          {[item.brand, item.category].filter(Boolean).join(" · ")}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-carbon-700">{item.location ?? "—"}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-carbon-700">
                        {item.lastServicedAt ? formatDate(item.lastServicedAt) : "ยังไม่เคย"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge value={item.status} />
                      </td>
                      <td className="px-5 py-4">
                        {item.openIssues > 0 ? (
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                              down ? "bg-pulse-500 text-white" : "bg-ember-50 text-ember-600",
                            )}
                          >
                            {down ? "ด่วนที่สุด" : "ติดตาม"} · ค้าง {item.openIssues}
                          </span>
                        ) : (
                          <span className="text-carbon-500">ปกติ (Normal)</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            aria-label={`เปลี่ยนสถานะของ ${item.name}`}
                            value={item.status}
                            onChange={(e) => void changeStatus(item, e.target.value as EquipmentStatus)}
                            className="w-40"
                          >
                            {STATUS_OPTIONS.map(([status, label]) => (
                              <option key={status} value={status}>
                                {label}
                              </option>
                            ))}
                          </Select>
                          <Button
                            variant="outline"
                            size="md"
                            onClick={() => setReportTarget(item)}
                            aria-label={`แจ้งซ่อม ${item.name}`}
                          >
                            <Wrench className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="ลงทะเบียนอุปกรณ์ใหม่"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              ยกเลิก
            </Button>
            <Button loading={saving} onClick={() => void createEquipment()}>
              เพิ่มเข้าทะเบียน
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="ชื่ออุปกรณ์ *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Technogym Skillrun Treadmill"
          />
          <Input
            label="หมายเลขเครื่อง (Asset ID) *"
            value={form.serialNumber}
            onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
            placeholder="EQ-TGM-9021"
            hint="ต้องไม่ซ้ำกับอุปกรณ์ชิ้นอื่นในคลับ"
          />
          <Select
            label="หมวดหมู่"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="ยี่ห้อ"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            placeholder="Technogym"
          />
          <Input
            label="โซนประจำจุด"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Cardio Deck (Lane 04)"
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        title="แจ้งอุปกรณ์ชำรุด"
        description={reportTarget?.name}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReportTarget(null)}>
              ยกเลิก
            </Button>
            <Button loading={saving} onClick={() => void submitIssue()}>
              ส่งคำขอแจ้งซ่อม
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="หัวข้ออาการ *"
            value={issue.title}
            onChange={(e) => setIssue({ ...issue, title: e.target.value })}
            placeholder="สายพานลื่นเมื่อวิ่งเกิน 14 กม./ชม."
          />
          <Textarea
            label="รายละเอียดอาการ *"
            value={issue.description}
            onChange={(e) => setIssue({ ...issue, description: e.target.value })}
            placeholder="ระบุอาการ ช่วงเวลาที่เกิด เสียงผิดปกติ หรือรหัสข้อผิดพลาดที่หน้าจอ"
          />
          <Select
            label="ระดับความเร่งด่วน"
            value={issue.priority}
            onChange={(e) => setIssue({ ...issue, priority: e.target.value as MaintenancePriority })}
            hint="ระดับสูงและด่วนที่สุดจะปิดการใช้งานอุปกรณ์ทันที"
          >
            {(
              [
                ["LOW", "ต่ำ"],
                ["MEDIUM", "ปานกลาง"],
                ["HIGH", "สูง"],
                ["CRITICAL", "ด่วนที่สุด"],
              ] as [MaintenancePriority, string][]
            ).map(([priority, label]) => (
              <option key={priority} value={priority}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </Modal>
    </>
  );
}
