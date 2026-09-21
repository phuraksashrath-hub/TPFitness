"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgePercent, Check, CreditCard, QrCode, Sparkles } from "lucide-react";
import { paymentApi, planApi, subscriptionApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import type { DiscountQuote, MembershipPlan, Payment, PaymentMethod, Subscription } from "@/lib/types";
import { formatDate, formatTHB, formatTHBPrecise } from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { usePaymentMode } from "@/lib/use-payment-mode";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/primitives";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

export default function MembershipPage() {
  const paymentMode = usePaymentMode();
  const toast = useToast();

  const [plans, setPlans] = useState<MembershipPlan[] | null>(null);
  const [history, setHistory] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [active, setActive] = useState<Subscription | null>(null);

  const [checkoutPlan, setCheckoutPlan] = useState<MembershipPlan | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [quote, setQuote] = useState<DiscountQuote | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("PROMPT_PAY");
  const [card, setCard] = useState({ holder: "", number: "", expiry: "" });
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ payment: Payment; message: string } | null>(null);

  const load = useCallback(async () => {
    const [planList, subs, pays, current] = await Promise.all([
      planApi.list().catch(() => []),
      subscriptionApi.mine().catch(() => []),
      paymentApi.mine().catch(() => []),
      subscriptionApi.active().catch(() => null),
    ]);
    setPlans(planList);
    setHistory(subs);
    setPayments(pays);
    setActive(current);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Re-price whenever the plan or promo code changes so the member always sees the true net amount.
  useEffect(() => {
    if (!checkoutPlan) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      subscriptionApi
        .quote(checkoutPlan.id, promoCode.trim() || undefined)
        .then((q) => !cancelled && setQuote(q))
        .catch(() => !cancelled && setQuote(null));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [checkoutPlan, promoCode]);

  function openCheckout(plan: MembershipPlan, renew: boolean) {
    setCheckoutPlan(plan);
    setRenewing(renew);
    setQuote(null);
    setPromoCode("");
  }

  async function submitCheckout() {
    if (!checkoutPlan) return;
    setSubmitting(true);
    try {
      const payload = {
        promoCode: promoCode.trim() || undefined,
        paymentMethod: method,
        cardHolderName: method === "CREDIT_CARD" ? card.holder : undefined,
        cardNumber: method === "CREDIT_CARD" ? card.number : undefined,
        cardExpiry: method === "CREDIT_CARD" ? card.expiry : undefined,
      };

      const result =
        renewing && active
          ? await subscriptionApi.renew(active.id, payload)
          : await subscriptionApi.subscribe(checkoutPlan.id, { ...payload, autoRenew: true });

      setCheckoutPlan(null);
      setReceipt({ payment: result.payment, message: result.gatewayMessage });
      toast.success(renewing ? "ต่ออายุแพ็กเกจเรียบร้อยแล้ว" : "เปิดใช้งานแพ็กเกจสำเร็จ ขอให้สนุกกับการฝึก");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "การชำระเงินไม่สำเร็จ"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {paymentMode !== "unknown" && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-glow-500/30 bg-glow-50 px-4 py-3 text-sm font-semibold text-carbon-900"
        >
          {paymentMode === "simulated"
            ? "โหมดสาธิต: ระบบชำระเงินเป็นการจำลอง ไม่มีการตัดเงินหรือเรียกเก็บเงินจริง"
            : "ระบบชำระเงินยังไม่เปิดให้บริการ กรุณาติดต่อเจ้าหน้าที่เพื่อสมัครหรือต่ออายุแพ็กเกจ"}
        </p>
      )}

      <PageHeading
        eyebrow="Membership & Billing"
        title="แพ็กเกจ การต่ออายุ และใบเสร็จ"
        description="ส่วนลดคำนวณโดย Discount Strategy Engine ฝั่งเซิร์ฟเวอร์ ระบบจะเลือกข้อเสนอที่คุ้มที่สุดให้เสมอ"
      />

      {active && (
        <Card raised className="mb-6 overflow-hidden">
          <div className="kinetic-band kinetic-grid relative grid gap-6 p-6 text-white md:grid-cols-[1.4fr_1fr] md:items-center">
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pulse-600">
                  {active.plan.tier}
                </span>
                <StatusBadge value={active.status} />
              </div>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight">
                {active.plan.name}
              </h2>
              <p className="mt-2 text-sm text-white/85">{active.plan.description}</p>

              <dl className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
                {[
                  { label: "เครดิต", value: active.remainingSessions },
                  { label: "วันคงเหลือ", value: active.daysRemaining },
                  { label: "เริ่มใช้งาน", value: formatDate(active.startDate) },
                  { label: "หมดอายุ", value: formatDate(active.endDate) },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-[11px] uppercase tracking-wider text-white/70">
                      {item.label}
                    </dt>
                    <dd className="mt-1 font-display text-lg font-bold">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative flex flex-col gap-3">
              <Button
                className="bg-white !text-pulse-600 hover:bg-ash-100"
                onClick={() => openCheckout(active.plan, true)}
              >
                <Sparkles className="size-4" /> ต่ออายุ {active.plan.name}
              </Button>
              <Button
                className="border-2 border-white bg-transparent hover:bg-white/10"
                onClick={async () => {
                  try {
                    await subscriptionApi.cancel(active.id);
                    toast.success("ยกเลิกแพ็กเกจสมาชิกแล้ว");
                    await load();
                  } catch (err) {
                    toast.error(apiErrorMessage(err, "ไม่สามารถยกเลิกแพ็กเกจได้"));
                  }
                }}
              >
                ยกเลิกแพ็กเกจ
              </Button>
            </div>
          </div>
        </Card>
      )}

      <h2 className="mb-4 font-display text-xl font-extrabold tracking-tight text-carbon-900">
        {active ? "เปลี่ยนไปแพ็กเกจอื่น" : "เลือกแพ็กเกจของคุณ"}
      </h2>

      <div className="grid gap-5 lg:grid-cols-3">
        {!plans && [0, 1, 2].map((i) => <Skeleton key={i} className="h-96" />)}

        {plans?.map((plan, index) => {
          const isCurrent = active?.plan.id === plan.id;
          const featured = index === (plans?.length ?? 1) - 1;
          return (
            <Card
              key={plan.id}
              raised={featured || isCurrent}
              className="flex flex-col overflow-hidden p-0"
            >
              <div
                className={cn(
                  "px-6 py-4 text-center text-white",
                  featured ? "bg-pulse-500" : "bg-carbon-900",
                )}
              >
                <p className="font-display text-lg font-extrabold tracking-tight">{plan.name}</p>
                <p className="mt-0.5 text-xs text-white/75">{plan.tier}</p>
              </div>

              <div className="flex flex-1 flex-col p-6">
                {isCurrent && (
                  <Badge tone="jade" className="mb-3 self-start">
                    แพ็กเกจปัจจุบัน
                  </Badge>
                )}

                <p className="min-h-10 text-sm text-carbon-500">{plan.description}</p>

                <p className="mt-5 font-display text-[40px] font-extrabold leading-none text-pulse-500">
                  {formatTHB(plan.price)}
                </p>
                <p className="mt-1 text-xs text-carbon-500">
                  {plan.durationDays} วัน · {plan.sessionsPerMonth} เซสชัน / เดือน
                </p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex gap-2.5 text-sm text-carbon-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-pulse-500" />
                      {perk}
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-6 w-full"
                  variant={featured ? "primary" : "carbon"}
                  disabled={isCurrent}
                  onClick={() => openCheckout(plan, false)}
                >
                  {isCurrent ? "ใช้งานอยู่" : `เลือก ${plan.name}`}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="ประวัติแพ็กเกจสมาชิก" />
          <CardBody className="space-y-2.5">
            {history.length === 0 && (
              <p className="text-sm text-carbon-500">ยังไม่มีประวัติแพ็กเกจ</p>
            )}
            {history.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-ash-300 bg-ash-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-carbon-900">{sub.plan.name}</p>
                  <p className="text-xs text-carbon-500">
                    {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
                  </p>
                </div>
                <StatusBadge value={sub.status} />
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="ประวัติการชำระเงิน" />
          <CardBody className="space-y-2.5">
            {payments.length === 0 && (
              <p className="text-sm text-carbon-500">ยังไม่มีรายการชำระเงิน</p>
            )}
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-lg border border-ash-300 bg-ash-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-carbon-900">
                    {payment.method === "CREDIT_CARD" ? (
                      <CreditCard className="size-4 text-pulse-500" />
                    ) : (
                      <QrCode className="size-4 text-pulse-500" />
                    )}
                    {payment.planName ?? "แพ็กเกจสมาชิก"}
                  </span>
                  <span className="font-display text-sm font-bold text-carbon-900">
                    {formatTHBPrecise(payment.netAmount)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-carbon-500">
                  <StatusBadge value={payment.status} />
                  <span className="font-mono">{payment.transactionReference}</span>
                  {payment.discountLabel && (
                    <span className="font-semibold text-jade-600">{payment.discountLabel}</span>
                  )}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* ---------- Checkout ---------- */}
      <Modal
        open={Boolean(checkoutPlan)}
        onClose={() => setCheckoutPlan(null)}
        title={renewing ? "ต่ออายุแพ็กเกจสมาชิก" : "ยืนยันการสมัครสมาชิก"}
        description={checkoutPlan?.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCheckoutPlan(null)}>
              ยกเลิก
            </Button>
            <Button loading={submitting} onClick={() => void submitCheckout()}>
              ชำระเงิน {quote ? formatTHBPrecise(quote.netAmount) : ""}
            </Button>
          </>
        }
      >
        {checkoutPlan && (
          <div className="space-y-6">
            <Input
              label="รหัสส่วนลด"
              placeholder="FITPULSE10, NEWYEAR20, VIP25…"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              hint="ระบบจะตรวจสอบสิทธิ์สมาชิกเก่า วันเกิด และแพ็กเกจระยะยาวให้โดยอัตโนมัติ"
            />

            <div className="rounded-xl border border-ash-300 bg-ash-50 p-4">
              <div className="flex items-center justify-between text-sm text-carbon-500">
                <span>ราคาแพ็กเกจ</span>
                <span>{formatTHBPrecise(quote?.grossAmount ?? checkoutPlan.price)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-jade-600">
                  <BadgePercent className="size-3.5" />
                  {quote?.label ?? "กำลังคำนวณข้อเสนอที่ดีที่สุด…"}
                </span>
                <span className="font-semibold text-jade-600">
                  −{formatTHBPrecise(quote?.discountAmount ?? 0)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-ash-300 pt-3">
                <span className="text-sm font-bold text-carbon-900">ยอดชำระสุทธิ</span>
                <span className="font-display text-xl font-extrabold text-pulse-500">
                  {formatTHBPrecise(quote?.netAmount ?? checkoutPlan.price)}
                </span>
              </div>

              {quote && quote.allOffers.length > 1 && (
                <p className="mt-3 text-xs text-carbon-500">
                  ข้อเสนออื่นที่ระบบพิจารณา:{" "}
                  {quote.allOffers
                    .slice(1)
                    .map((o) => `${o.label} (${formatTHB(o.amount)})`)
                    .join(", ")}
                </p>
              )}
            </div>

            <div>
              <p className="mb-3 text-[13px] font-bold tracking-[0.04em] text-carbon-700">
                ช่องทางการชำระเงิน *
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { id: "PROMPT_PAY", label: "PromptPay QR", icon: QrCode },
                    { id: "CREDIT_CARD", label: "บัตรเครดิต", icon: CreditCard },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMethod(id)}
                    aria-pressed={method === id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-all focus-pulse",
                      method === id
                        ? "border-pulse-500 bg-pulse-50 text-pulse-600"
                        : "border-ash-300 bg-white text-carbon-700 hover:border-ash-500",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {method === "CREDIT_CARD" && (
              <div className="space-y-3">
                <Input
                  label="ชื่อบนบัตร *"
                  value={card.holder}
                  onChange={(e) => setCard({ ...card, holder: e.target.value })}
                  placeholder="ตามที่ปรากฏบนหน้าบัตร"
                  autoComplete="cc-name"
                />
                <Input
                  label="หมายเลขบัตร *"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value })}
                  placeholder="4539 5787 6362 1486"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  hint="ระบบจัดเก็บเฉพาะเลข 4 ตัวท้ายและประเภทบัตรเท่านั้น"
                />
                <Input
                  label="วันหมดอายุ *"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ---------- Receipt ---------- */}
      <Modal
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        title="ชำระเงินสำเร็จ"
        size="sm"
        footer={<Button onClick={() => setReceipt(null)}>เสร็จสิ้น</Button>}
      >
        {receipt && (
          <div className="space-y-4">
            <div className="rounded-xl border border-jade-400/40 bg-jade-50 p-4 text-sm font-medium text-jade-600">
              {receipt.message}
            </div>
            <dl className="space-y-2.5 text-sm">
              {[
                ["เลขที่อ้างอิง", receipt.payment.transactionReference],
                [
                  "ช่องทาง",
                  receipt.payment.method === "CREDIT_CARD" ? "บัตรเครดิต" : "PromptPay QR",
                ],
                ["ยอดก่อนส่วนลด", formatTHBPrecise(receipt.payment.grossAmount)],
                ["ส่วนลด", `−${formatTHBPrecise(receipt.payment.discountAmount)}`],
                ["ยอดชำระสุทธิ", formatTHBPrecise(receipt.payment.netAmount)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-carbon-500">{label}</dt>
                  <dd className="text-right font-semibold text-carbon-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Modal>
    </>
  );
}
