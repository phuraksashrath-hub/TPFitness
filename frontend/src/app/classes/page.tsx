import type { Metadata } from "next";
import { Suspense } from "react";
import { BackToTop, SiteFooter, SiteHeader } from "@/components/landing/site-chrome";
import { ClassTimetable } from "@/components/classes/class-timetable";
import { Skeleton } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "ตารางคลาสและสำรองที่นั่ง — TP Fitness" };

export default function ClassesPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-27">
        <section className="kinetic-grid relative overflow-hidden bg-carbon-900 text-white">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
            <p className="slash mb-3 text-xs font-bold uppercase tracking-[0.16em] text-pulse-500">Group Classes</p>
            <h1 className="font-display text-[30px] font-extrabold tracking-tight sm:text-5xl">
              ตารางคลาสและสำรองที่นั่ง
            </h1>
            <p className="mt-4 max-w-2xl text-base text-ash-500">
              HIIT, โยคะ, BodyPump, ปั่นจักรยาน และอีกมากมาย ดูตารางล่วงหน้า 14 วัน สมาชิกจองและยกเลิกที่นั่งได้เอง
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <ClassTimetable loginPath="/classes" />
          </Suspense>
        </section>
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
