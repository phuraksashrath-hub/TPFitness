import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Clock, Mail, MapPin, Phone } from "lucide-react";
import { BackToTop, SiteFooter, SiteHeader } from "@/components/landing/site-chrome";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "ติดต่อและสอบถามข้อมูล — TP Fitness" };

const CHANNELS = [
  {
    icon: Phone,
    title: "โทรหาเรา",
    value: "02-012-3456",
    note: "ทีมดูแลลูกค้าพร้อมให้ข้อมูลตลอด 24 ชั่วโมง",
    href: "tel:020123456",
    cta: "โทรเลย",
  },
  {
    icon: Mail,
    title: "อีเมล",
    value: "support@tpfitness.co.th",
    note: "สอบถามแพ็กเกจ การชำระเงิน หรือปัญหาการใช้งาน ทีมงานจะตอบกลับทางอีเมล",
    href: "mailto:support@tpfitness.co.th",
    cta: "ส่งอีเมล",
  },
  {
    icon: MapPin,
    title: "แวะที่สาขา",
    value: "เคาน์เตอร์ต้อนรับทุกสาขา",
    note: "เลือกสาขาที่สะดวก ดูเวลาเปิด และเบอร์โทรของแต่ละสาขา",
    href: "/clubs",
    cta: "ค้นหาสาขา",
  },
];

const FAQ: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: "แพ็กเกจและการสมัคร",
    items: [
      {
        q: "มีแพ็กเกจอะไรบ้าง และดูราคาได้ที่ไหน",
        a: "ราคา ระยะสัญญา และสิทธิ์ของแต่ละแพ็กเกจแสดงที่หน้าแรกในส่วน “สมัครสมาชิกออนไลน์” ซึ่งดึงข้อมูลล่าสุดจากระบบเสมอ",
      },
      {
        q: "ทดลองเล่นฟรีได้อย่างไร",
        a: "กรอกฟอร์ม “ทดลองเล่นฟรี 3 วัน” ที่ท้ายหน้าแรก (ไม่ต้องใช้บัตรเครดิต) ทีมงานจะโทรกลับเพื่อนัดวันเริ่มทดลอง",
      },
      {
        q: "มีโค้ดส่วนลดไหม ใช้อย่างไร",
        a: "ใส่โค้ดในหน้าชำระเงินตอนสมัครหรือต่ออายุ ระบบจะคำนวณส่วนลดทุกรูปแบบที่คุณมีสิทธิ์และเลือกข้อเสนอที่คุ้มที่สุดให้อัตโนมัติ เห็นยอดสุทธิก่อนยืนยันทุกครั้ง",
      },
      {
        q: "ยกเลิกหรือต่ออายุแพ็กเกจได้ที่ไหน",
        a: "เข้าสู่ระบบแล้วไปที่เมนู “แพ็กเกจสมาชิก” ในพอร์ทัลสมาชิก ต่ออายุ อัปเกรด หรือยกเลิกแพ็กเกจได้ด้วยตัวเอง",
      },
    ],
  },
  {
    group: "การจองเทรนเนอร์และคลาส",
    items: [
      {
        q: "จองเทรนเนอร์ส่วนตัว (PT) ได้ช่วงเวลาไหน",
        a: "จองได้ระหว่าง 06:00 – 22:00 น. (แสดงตามเวลา UTC เหมือนทั้งระบบ) ต้องมีแพ็กเกจที่ใช้งานอยู่และมีเครดิตเซสชันเหลือ ระบบแสดงเฉพาะช่วงที่เทรนเนอร์ว่างจริง",
      },
      {
        q: "ยกเลิกหรือเลื่อนนัดได้ไหม",
        a: "ได้ ยกเลิกนัดได้ล่วงหน้าอย่างน้อย 2 ชั่วโมงก่อนเริ่ม และเครดิตเซสชันจะถูกคืนให้ ส่วนการเลื่อนนัดไปช่วงเวลาว่างอื่น ทำได้ที่หน้า “จองเซสชัน” ในพอร์ทัลสมาชิก",
      },
      {
        q: "จองคลาสกรุ๊ปต้องใช้เครดิต PT ไหม",
        a: "ไม่ใช้ คลาสกรุ๊ปจองที่นั่งได้ทุกแพ็กเกจที่ยังไม่หมดอายุ ที่นั่งมีจำกัด และยกเลิกที่นั่งได้ล่วงหน้าอย่างน้อย 2 ชั่วโมง ดูตารางได้ที่หน้า “คลาส”",
      },
      {
        q: "จองแล้วแต่เวลาชนกับนัดอื่น จะเกิดอะไรขึ้น",
        a: "ระบบไม่อนุญาตให้จองซ้อนเวลา ทั้งนัด PT และคลาสกรุ๊ป จะแจ้งให้เลือกช่วงเวลาอื่นทันที",
      },
    ],
  },
  {
    group: "การชำระเงินและบัญชี",
    items: [
      {
        q: "ชำระเงินได้ช่องทางไหน",
        a: "บัตรเครดิตและ PromptPay QR ระบบไม่เก็บหมายเลขบัตรของคุณ เก็บเฉพาะยี่ห้อบัตรและเลข 4 ตัวท้ายสำหรับแสดงในประวัติการชำระเงิน",
      },
      {
        q: "บัญชีถูกระงับ หรือเข้าสู่ระบบไม่ได้",
        a: "หากระบบแจ้งว่าบัญชีถูกระงับ กรุณาติดต่อเคาน์เตอร์ต้อนรับของสาขาหรือส่งอีเมลถึงเรา พร้อมแจ้งอีเมลที่ใช้สมัคร",
      },
      {
        q: "แก้ไขข้อมูลส่วนตัวหรือเปลี่ยนรหัสผ่านได้ที่ไหน",
        a: "ที่เมนู “โปรไฟล์” ในพอร์ทัลของคุณ แก้ไขชื่อ เบอร์โทร ข้อมูลร่างกาย และเปลี่ยนรหัสผ่านได้ในหน้าเดียว",
      },
    ],
  },
];

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-27">
        <section className="kinetic-grid relative overflow-hidden bg-carbon-900 text-white">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
            <p className="slash mb-3 text-xs font-bold uppercase tracking-[0.16em] text-pulse-500">Contact</p>
            <h1 className="font-display text-[30px] font-extrabold tracking-tight sm:text-5xl">
              ติดต่อและสอบถามข้อมูล
            </h1>
            <p className="mt-4 max-w-2xl text-base text-ash-500">
              มีคำถามเกี่ยวกับแพ็กเกจ หรือต้องการความช่วยเหลือเรื่องการใช้งาน ทีมงานพร้อมดูแลตลอด 24 ชั่วโมง
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8" aria-label="ช่องทางติดต่อ">
          <div className="grid gap-5 md:grid-cols-3">
            {CHANNELS.map(({ icon: Icon, title, value, note, href, cta }) => (
              <div key={title} className="surface flex flex-col p-6">
                <span className="grid size-11 place-items-center rounded-lg bg-pulse-50 text-pulse-500">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-4 font-display text-lg font-bold text-carbon-900">{title}</h2>
                <p className="mt-1 break-all font-display text-xl font-extrabold text-pulse-500">{value}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-carbon-500">{note}</p>
                <div className="mt-5">
                  <LinkButton href={href} size="sm" variant="outline">
                    {cta}
                  </LinkButton>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-carbon-500">
            <Clock className="size-4 text-pulse-500" />
            สำนักงานใหญ่ กรุงเทพมหานคร · เวลาเปิดของแต่ละสาขาต่างกัน ตรวจสอบได้ที่{" "}
            <Link href="/clubs" className="font-bold text-pulse-500 hover:text-pulse-600">
              หน้าค้นหาคลับ
            </Link>
          </p>
        </section>

        <section className="border-t border-ash-300 bg-white py-14" aria-label="คำถามที่พบบ่อย">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <p className="slash mb-3 text-xs font-bold uppercase tracking-[0.16em] text-pulse-500">FAQ</p>
            <h2 className="font-display text-[26px] font-extrabold tracking-tight text-carbon-900 sm:text-4xl">
              คำถามที่พบบ่อย
            </h2>

            <div className="mt-8 space-y-10">
              {FAQ.map((section) => (
                <div key={section.group}>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-carbon-500">{section.group}</h3>
                  <div className="divide-y divide-ash-300 rounded-2xl border border-ash-300">
                    {section.items.map((item) => (
                      <details key={item.q} className="group open:bg-ash-50">
                        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display font-bold text-carbon-900 focus-pulse [&::-webkit-details-marker]:hidden">
                          {item.q}
                          <ChevronDown className="size-5 shrink-0 text-pulse-500 transition-transform group-open:rotate-180" />
                        </summary>
                        <p className="px-5 pb-4 text-sm leading-relaxed text-carbon-500">{item.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-14 text-center sm:px-8">
          <h2 className="font-display text-2xl font-extrabold text-carbon-900">ยังไม่พบคำตอบที่ต้องการ?</h2>
          <p className="mt-2 text-carbon-500">ส่งคำถามมาได้เลย หรือลองเล่นฟรี 3 วันเพื่อดูสถานที่จริง</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <LinkButton href="mailto:support@tpfitness.co.th">ส่งอีเมลถึงทีมงาน</LinkButton>
            <LinkButton href="/#trial" variant="outline">
              ทดลองเล่นฟรี 3 วัน
            </LinkButton>
          </div>
        </section>
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
