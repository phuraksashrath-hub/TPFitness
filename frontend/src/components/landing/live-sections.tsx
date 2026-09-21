"use client";

import { useEffect, useState } from "react";
import { Award, Check, Star, Trophy } from "lucide-react";
import { planApi, trainerApi } from "@/lib/services";
import type { MembershipPlan, Trainer } from "@/lib/types";
import { formatTHB } from "@/lib/format";
import { Card, SectionTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function PricingSection() {
  const [plans, setPlans] = useState<MembershipPlan[] | null>(null);

  useEffect(() => {
    planApi
      .list()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  return (
    <section id="membership" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <SectionTitle
        align="center"
        eyebrow="TP Fitness Online Sign-Up"
        title="สมัครสมาชิกออนไลน์"
        description="ทุกแพ็กเกจรวมสิทธิ์เข้าคลับตลอด 24 ชม. คลาสกรุ๊ปไม่จำกัด และแอปสมาชิก TP Fitness โดยราคาดึงตรงมาจากระบบบริหารจัดการจริง"
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {!plans && [0, 1, 2].map((i) => <Skeleton key={i} className="h-[30rem] rounded-2xl" />)}

        {plans?.length === 0 && (
          <p className="text-center text-sm text-carbon-500 lg:col-span-3">
            ยังไม่สามารถโหลดแพ็กเกจได้ กรุณาเริ่มการทำงานของ TP Fitness API เพื่อดูราคาล่าสุด
          </p>
        )}

        {plans?.map((plan, index) => {
          const featured = index === plans.length - 1;
          const months = Math.max(1, Math.round(plan.durationDays / 30));
          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300",
                featured
                  ? "border-2 border-pulse-500 shadow-pulse lg:-translate-y-3"
                  : "border border-carbon-900/10 shadow-card hover:-translate-y-1 hover:border-pulse-500",
              )}
            >
              {/* Header ribbon */}
              <div
                className={cn(
                  "px-6 py-4 text-center",
                  featured ? "bg-pulse-500" : "bg-carbon-900",
                )}
              >
                <p className="font-display text-xl font-extrabold tracking-tight text-white">
                  {plan.name}
                </p>
                <p className="mt-0.5 text-xs text-white/75">สัญญา {months} เดือน</p>
              </div>

              <div className="flex flex-1 flex-col p-6 text-center">
                {featured && (
                  <p className="mb-2 inline-flex items-center justify-center gap-1.5 self-center text-xs font-bold text-pulse-500">
                    <Trophy className="size-3.5" /> ยอดนิยมอันดับ 1
                  </p>
                )}

                <p className="text-xs font-semibold text-carbon-500">เฉลี่ยเพียง</p>
                <p className="font-display text-[48px] font-extrabold leading-none tracking-tight text-pulse-500">
                  {formatTHB(plan.price / months)}
                </p>
                <p className="text-sm text-carbon-500">/ เดือน</p>

                <p className="mt-1.5 text-xs text-carbon-500">
                  ชำระรวม {formatTHB(plan.price)} · เทรนเนอร์ส่วนตัว {plan.sessionsPerMonth} ครั้ง /
                  เดือน
                </p>

                {plan.description && (
                  <p className="mt-3 min-h-10 text-sm leading-relaxed text-carbon-500">
                    {plan.description}
                  </p>
                )}

                <ul className="mt-5 flex-1 space-y-2.5 text-left">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-sm text-carbon-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-pulse-500" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <LinkButton
                  href="/register"
                  variant={featured ? "primary" : "carbon"}
                  className="mt-6 w-full"
                >
                  เลือกแพ็กเกจ {plan.name}
                </LinkButton>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-carbon-500">
        ทุกแพ็กเกจรวมคลาสกรุ๊ป BodyPump, Yoga, Cycling, Zumba และ HYROX Prep
        โดยไม่มีค่าใช้จ่ายเพิ่มเติม สำหรับสมาชิกทุกระดับ
      </p>
    </section>
  );
}

export function CoachesSection() {
  const [trainers, setTrainers] = useState<Trainer[] | null>(null);

  useEffect(() => {
    trainerApi
      .list()
      .then(setTrainers)
      .catch(() => setTrainers([]));
  }, []);

  return (
    <section id="coaches" className="bg-ash-100 py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionTitle
          eyebrow="The coaching floor"
          title="โค้ชที่ออกแบบโปรแกรมให้ ไม่ใช่แค่นับเรป"
          description="เทรนเนอร์ TP Fitness ทุกคนถือใบรับรองระดับสากล และจะเขียนโปรแกรมฝึกเป็นลายลักษณ์อักษรในระบบให้คุณก่อนเซตแรกเสมอ"
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {!trainers && [0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}

          {trainers?.length === 0 && (
            <p className="text-sm text-carbon-500 lg:col-span-3">ยังไม่มีข้อมูลเทรนเนอร์ในระบบ</p>
          )}

          {trainers?.map((trainer) => (
            <Card
              key={trainer.id}
              className="p-6 transition-all duration-200 hover:border-pulse-500 hover:shadow-pulse"
            >
              <div className="flex items-center gap-4">
                <Avatar name={trainer.fullName} src={trainer.avatarUrl} size={56} />
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold text-carbon-900">
                    {trainer.fullName}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-pulse-500">
                    <Star className="size-3.5 fill-current" />
                    {trainer.ratingAverage.toFixed(2)}
                    <span className="font-normal text-carbon-500">
                      ({trainer.ratingCount} รีวิว)
                    </span>
                  </p>
                </div>
              </div>

              {trainer.specialization && (
                <Badge tone="pulse" className="mt-4">
                  {trainer.specialization}
                </Badge>
              )}

              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-carbon-500">
                {trainer.bio ?? "โค้ชผู้เชี่ยวชาญของ TP Fitness"}
              </p>

              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-ash-300 pt-4 text-center">
                <div>
                  <dt className="text-[11px] text-carbon-500">ประสบการณ์</dt>
                  <dd className="mt-1 font-display text-lg font-bold text-carbon-900">
                    {trainer.yearsOfExperience} ปี
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-carbon-500">ค่าบริการ</dt>
                  <dd className="mt-1 font-display text-lg font-bold text-carbon-900">
                    {formatTHB(trainer.hourlyRate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-carbon-500">ใบรับรอง</dt>
                  <dd className="mt-1 flex justify-center">
                    <Award className="size-5 text-pulse-500" />
                  </dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
