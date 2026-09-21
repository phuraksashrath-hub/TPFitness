"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Pencil, Plus } from "lucide-react";
import { branchApi } from "@/lib/services";
import type { SaveBranchPayload } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import type { Branch } from "@/lib/types";
import { PageHeading } from "@/components/portal/portal-shell";
import { Skeleton } from "@/components/ui/primitives";
import { Card, EmptyState } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

interface BranchForm {
  name: string;
  address: string;
  district: string;
  province: string;
  phone: string;
  latitude: string;
  longitude: string;
  openingHours: string;
  facilities: string;
  isActive: boolean;
}

const emptyForm = (): BranchForm => ({
  name: "",
  address: "",
  district: "",
  province: "",
  phone: "",
  latitude: "",
  longitude: "",
  openingHours: "เปิดให้บริการ 24 ชั่วโมง",
  facilities: "",
  isActive: true,
});

export default function AdminBranchesPage() {
  const toast = useToast();
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setBranches(await branchApi.all());
    } catch (err) {
      setBranches([]);
      toast.error(apiErrorMessage(err, "ไม่สามารถโหลดรายชื่อสาขาได้"));
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(b: Branch) {
    setEditing(b);
    setForm({
      name: b.name,
      address: b.address,
      district: b.district,
      province: b.province,
      phone: b.phone ?? "",
      latitude: b.latitude?.toString() ?? "",
      longitude: b.longitude?.toString() ?? "",
      openingHours: b.openingHours,
      facilities: b.facilities.join(", "),
      isActive: b.isActive,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.address.trim() || !form.district.trim() || !form.province.trim()) {
      toast.error("กรุณากรอกชื่อ ที่อยู่ เขต/อำเภอ และจังหวัด");
      return;
    }
    const payload: SaveBranchPayload = {
      name: form.name.trim(),
      address: form.address.trim(),
      district: form.district.trim(),
      province: form.province.trim(),
      phone: form.phone.trim() || null,
      latitude: form.latitude.trim() ? Number(form.latitude) : null,
      longitude: form.longitude.trim() ? Number(form.longitude) : null,
      openingHours: form.openingHours.trim() || null,
      facilities: form.facilities.split(",").map((f) => f.trim()).filter(Boolean),
      isActive: form.isActive,
    };
    setSaving(true);
    try {
      if (editing) await branchApi.update(editing.id, payload);
      else await branchApi.create(payload);
      toast.success(editing ? "อัปเดตข้อมูลสาขาเรียบร้อยแล้ว" : "เพิ่มสาขาเรียบร้อยแล้ว");
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถบันทึกสาขาได้"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Branches & Clubs"
        title="สาขาและคลับ"
        description="ข้อมูลที่นี่คือสิ่งที่ลูกค้าเห็นในหน้า ค้นหาคลับใกล้บ้าน สาขาที่ปิดจะไม่แสดงต่อสาธารณะ"
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> เพิ่มสาขา
          </Button>
        }
      />

      {!branches && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {branches?.length === 0 && (
        <EmptyState icon={<MapPin className="size-7" />} title="ยังไม่มีสาขา" description="เพิ่มสาขาแรกเพื่อให้ลูกค้าค้นหาได้" />
      )}

      {branches && branches.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-ash-200 text-[11px] font-bold uppercase tracking-wider text-carbon-500">
                <tr>
                  <th className="px-5 py-3.5">สาขา</th>
                  <th className="px-5 py-3.5">ที่ตั้ง</th>
                  <th className="px-5 py-3.5">เวลาเปิด / โทร</th>
                  <th className="px-5 py-3.5">สิ่งอำนวยความสะดวก</th>
                  <th className="px-5 py-3.5">สถานะ</th>
                  <th className="px-5 py-3.5 text-right">แก้ไข</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ash-300">
                {branches.map((b) => (
                  <tr key={b.id} className={cn("align-top", !b.isActive && "opacity-60")}>
                    <td className="px-5 py-4 font-display font-bold text-carbon-900">{b.name}</td>
                    <td className="px-5 py-4 text-carbon-700">
                      <p>{b.address}</p>
                      <p className="text-xs text-carbon-500">
                        {b.district} · {b.province}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-carbon-700">
                      <p>{b.openingHours}</p>
                      <p className="text-xs text-carbon-500">{b.phone ?? "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {b.facilities.map((f) => (
                          <Badge key={f} tone="ash">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">{b.isActive ? <Badge tone="jade">เปิดให้บริการ</Badge> : <Badge tone="ash">ปิดชั่วคราว</Badge>}</td>
                    <td className="px-5 py-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(b)} aria-label={`แก้ไข ${b.name}`}>
                        <Pencil className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "แก้ไขข้อมูลสาขา" : "เพิ่มสาขาใหม่"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button loading={saving} onClick={() => void save()}>
              {editing ? "บันทึก" : "เพิ่มสาขา"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="ชื่อสาขา *" value={form.name} maxLength={160} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="TP Fitness สยาม" />
          <Input label="ที่อยู่ *" value={form.address} maxLength={300} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="เขต / อำเภอ *" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <Input label="จังหวัด *" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="เบอร์โทรศัพท์" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="02-012-3456" />
            <Input label="เวลาเปิดให้บริการ" value={form.openingHours} maxLength={120} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="ละติจูด" type="number" step="any" min={-90} max={90} value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="13.7233" />
            <Input label="ลองจิจูด" type="number" step="any" min={-180} max={180} value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="100.5697" />
          </div>
          <Input label="สิ่งอำนวยความสะดวก" value={form.facilities} onChange={(e) => setForm({ ...form, facilities: e.target.value })} hint="คั่นด้วยเครื่องหมายจุลภาค เช่น Free Weights, Cardio Deck, Sauna" />
          <label className="flex items-center gap-2.5 text-sm font-semibold text-carbon-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="size-4 accent-pulse-500" />
            เปิดให้บริการ (แสดงในหน้าค้นหาคลับ)
          </label>
        </div>
      </Modal>
    </>
  );
}
