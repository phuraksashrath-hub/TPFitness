"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, Plus } from "lucide-react";
import { paymentApi, planApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import type { MembershipPlan, Payment } from "@/lib/types";
import { formatDate, formatTHB, formatTHBPrecise } from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Skeleton, StatCard } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const TIERS = ["STANDARD", "PREMIUM", "ELITE"];

export default function AdminPlansPage() {
  const toast = useToast();
  const [plans, setPlans] = useState<MembershipPlan[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    durationDays: 30,
    sessionsPerMonth: 4,
    tier: "STANDARD",
    perks: "",
  });

  const load = useCallback(async () => {
    const [planList, paymentList] = await Promise.all([
      planApi.list(true).catch(() => []),
      paymentApi.all(50).catch(() => []),
    ]);
    setPlans(planList);
    setPayments(paymentList);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openEditor(plan: MembershipPlan | null) {
    setEditing(plan);
    setCreating(plan === null);
    setForm({
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      price: plan?.price ?? 0,
      durationDays: plan?.durationDays ?? 30,
      sessionsPerMonth: plan?.sessionsPerMonth ?? 4,
      tier: plan?.tier ?? "STANDARD",
      perks: plan?.perks.join("\n") ?? "",
    });
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("กรุณาระบุชื่อแพ็กเกจ");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      durationDays: Number(form.durationDays),
      sessionsPerMonth: Number(form.sessionsPerMonth),
      tier: form.tier,
      perks: form.perks.split("\n").map((p) => p.trim()).filter(Boolean),
      isActive: true,
    };

    try {
      if (editing) {
        await planApi.update(editing.id, payload);
        toast.success("อัปเดตแพ็กเกจเรียบร้อยแล้ว");
      } else {
        await planApi.create(payload);
        toast.success("เผยแพร่แพ็กเกจใหม่แล้ว");
      }
      setEditing(null);
      setCreating(false);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถบันทึกแพ็กเกจได้"));
    } finally {
      setSaving(false);
    }
  }

  async function archive(plan: MembershipPlan) {
    try {
      await planApi.deactivate(plan.id);
      toast.success(`เก็บแพ็กเกจ ${plan.name} เข้าคลังแล้ว สมาชิกเดิมยังใช้งานได้ตามปกติ`);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถเก็บแพ็กเกจได้"));
    }
  }

  const totalCollected = payments.reduce(
    (sum, p) => (p.status === "PAID" ? sum + p.netAmount : sum),
    0,
  );
  const totalDiscount = payments.reduce((sum, p) => sum + p.discountAmount, 0);

  return (
    <>
      <PageHeading
        eyebrow="Package & Discount Strategy"
        title="แพ็กเกจสมาชิกและธุรกรรม"
        description="แพ็กเกจที่เก็บเข้าคลังจะยังใช้ได้กับสมาชิกที่ซื้อไปแล้วจนหมดอายุ"
        action={
          <Button onClick={() => openEditor(null)}>
            <Plus className="size-4" /> สร้างแพ็กเกจใหม่
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="ยอดจัดเก็บ (50 รายการล่าสุด)" value={formatTHB(totalCollected)} />
        <StatCard label="ส่วนลดที่มอบให้" value={formatTHB(totalDiscount)} tone="carbon" />
        <StatCard
          label="แพ็กเกจที่เปิดขาย"
          value={plans?.filter((p) => p.isActive).length ?? 0}
          tone="jade"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {!plans && [0, 1, 2].map((i) => <Skeleton key={i} className="h-80" />)}

        {plans?.map((plan) => (
          <Card key={plan.id} className="flex flex-col overflow-hidden p-0">
            <div
              className={cn(
                "px-6 py-4 text-center text-white",
                plan.isActive ? "bg-pulse-500" : "bg-carbon-700",
              )}
            >
              <p className="font-display text-lg font-extrabold tracking-tight">{plan.name}</p>
              <p className="mt-0.5 text-xs text-white/75">
                {plan.tier}
                {plan.isActive ? "" : " · เก็บเข้าคลังแล้ว"}
              </p>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <p className="min-h-10 text-sm text-carbon-500">{plan.description}</p>

              <p className="mt-4 font-display text-3xl font-extrabold leading-none text-pulse-500">
                {formatTHB(plan.price)}
              </p>
              <p className="mt-1 text-xs text-carbon-500">
                {plan.durationDays} วัน · {plan.sessionsPerMonth} เซสชัน / เดือน
              </p>

              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-carbon-500">
                {plan.perks.map((perk) => (
                  <li key={perk}>· {perk}</li>
                ))}
              </ul>

              <div className="mt-5 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditor(plan)}
                >
                  แก้ไขสิทธิ์ / ราคา
                </Button>
                {plan.isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void archive(plan)}
                    aria-label={`เก็บแพ็กเกจ ${plan.name} เข้าคลัง`}
                  >
                    <Archive className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader
          title="สมุดธุรกรรม (Transaction Ledger)"
          subtitle="50 รายการล่าสุดทั่วทั้งคลับ"
        />
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-y border-ash-300 bg-ash-100 text-xs font-bold uppercase tracking-wider text-carbon-500">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  เลขที่อ้างอิง
                </th>
                <th scope="col" className="px-6 py-3.5">
                  สมาชิก
                </th>
                <th scope="col" className="px-6 py-3.5">
                  แพ็กเกจ
                </th>
                <th scope="col" className="px-6 py-3.5">
                  ช่องทาง
                </th>
                <th scope="col" className="px-6 py-3.5">
                  ส่วนลด
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  ยอดสุทธิ
                </th>
                <th scope="col" className="px-6 py-3.5">
                  สถานะ
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-carbon-500">
                    ยังไม่มีธุรกรรม
                  </td>
                </tr>
              )}
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-ash-200 last:border-0 hover:bg-pulse-50/40"
                >
                  <td className="px-6 py-3.5 font-mono text-xs text-carbon-700">
                    {payment.transactionReference}
                    <p className="text-[11px] text-carbon-500">
                      {payment.paidAt ? formatDate(payment.paidAt) : "—"}
                    </p>
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-carbon-900">
                    {payment.memberName ?? "—"}
                  </td>
                  <td className="px-6 py-3.5 text-carbon-500">{payment.planName ?? "—"}</td>
                  <td className="px-6 py-3.5 text-carbon-500">
                    {payment.method === "CREDIT_CARD" ? "บัตรเครดิต" : "PromptPay QR"}
                    {payment.cardLast4 && (
                      <span className="ml-1 text-xs text-carbon-500">····{payment.cardLast4}</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-xs font-semibold text-jade-600">
                    {payment.discountAmount > 0 ? (
                      <>
                        −{formatTHB(payment.discountAmount)}
                        <p className="text-[11px] font-normal text-carbon-500">
                          {payment.discountLabel}
                        </p>
                      </>
                    ) : (
                      <span className="text-carbon-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right font-display font-bold text-carbon-900">
                    {formatTHBPrecise(payment.netAmount)}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge value={payment.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Modal
        open={creating || Boolean(editing)}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        title={editing ? `แก้ไขแพ็กเกจ ${editing.name}` : "สร้างแพ็กเกจใหม่"}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
            >
              ยกเลิก
            </Button>
            <Button loading={saving} onClick={() => void save()}>
              {editing ? "บันทึกการแก้ไข" : "เผยแพร่แพ็กเกจ"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="ชื่อแพ็กเกจ *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Stay Fit 12 Months"
            />
            <Select
              label="ระดับแพ็กเกจ"
              value={form.tier}
              onChange={(e) => setForm({ ...form, tier: e.target.value })}
            >
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="รายละเอียด"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="รวมทุกสิทธิ์ของ Flexi พร้อมคลาสกรุ๊ปไม่จำกัดและเทรนเนอร์ส่วนตัว 8 ครั้ง/เดือน"
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="ราคา (บาท)"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
            <Input
              label="อายุแพ็กเกจ (วัน)"
              type="number"
              min={1}
              value={form.durationDays}
              onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
            />
            <Input
              label="เซสชัน PT / เดือน"
              type="number"
              min={0}
              value={form.sessionsPerMonth}
              onChange={(e) => setForm({ ...form, sessionsPerMonth: Number(e.target.value) })}
            />
          </div>

          <Textarea
            label="สิทธิประโยชน์"
            value={form.perks}
            onChange={(e) => setForm({ ...form, perks: e.target.value })}
            placeholder={"เข้าใช้งานคลับ 24 ชม.\nคลาสกรุ๊ปไม่จำกัด\nปรึกษาโภชนาการ"}
            hint="กรอกสิทธิประโยชน์บรรทัดละ 1 ข้อ"
            className="min-h-32"
          />
        </div>
      </Modal>
    </>
  );
}
