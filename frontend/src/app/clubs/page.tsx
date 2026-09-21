import type { Metadata } from "next";
import { BackToTop, SiteFooter, SiteHeader } from "@/components/landing/site-chrome";
import { ClubFinder } from "@/components/clubs/club-finder";

export const metadata: Metadata = { title: "ค้นหาคลับใกล้บ้านคุณ — TP Fitness" };

export default function ClubsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-27">
        <section className="kinetic-grid relative overflow-hidden bg-carbon-900 text-white">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
            <p className="slash mb-3 text-xs font-bold uppercase tracking-[0.16em] text-pulse-500">Club Finder</p>
            <h1 className="font-display text-[30px] font-extrabold tracking-tight sm:text-5xl">
              ค้นหาคลับใกล้บ้านคุณ
            </h1>
            <p className="mt-4 max-w-2xl text-base text-ash-500">
              เลือกสาขาที่สะดวก ดูเวลาเปิด เบอร์ติดต่อ สิ่งอำนวยความสะดวก และเปิดเส้นทางในแผนที่ได้ทันที
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <ClubFinder />
        </section>
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
