import Image from "next/image";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  CreditCard,
  Dumbbell,
  Gift,
  LineChart,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  Wrench,
} from "lucide-react";
import { BackToTop, SiteFooter, SiteHeader } from "@/components/landing/site-chrome";
import { CoachesSection, PricingSection } from "@/components/landing/live-sections";
import { SectionTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { TrialForm } from "@/components/landing/trial-form";
import { Badge } from "@/components/ui/badge";

const HERO_BULLETS = [
  "ฝึกหุ่นกับเทรนเนอร์มืออาชีพฟรี 2 ครั้ง (มูลค่า 3,000 บ.)",
  "เล่นฟิตเนสฟรีเพิ่ม 1 เดือน เมื่อสมัครตามเงื่อนไข",
  "เข้าใช้งานได้ตลอด 24 ชม. ไม่จำกัด ทุกคลาส ทุกสาขาทั่วประเทศ",
];

const QUICK_STATS = [
  { icon: Timer, value: "24 / 7", label: "เปิดบริการตลอด 24 ชั่วโมง" },
  { icon: Building2, value: "6 สาขา", label: "ครอบคลุมกรุงเทพและหัวเมือง" },
  { icon: Dumbbell, value: "1,000+", label: "เครื่องออกกำลังกายระดับสากล" },
  { icon: Users, value: "6 โค้ช", label: "Certified ACE, NASM และ HYROX" },
];

const EXPERIENCE = [
  {
    image: "/images/exp-classes.jpg",
    title: "พบกับคลาสออกกำลังกายสุดมันส์",
    body: "เรียกเหงื่อ ค้นหาคลาสที่เหมาะสมกับร่างกายและไลฟ์สไตล์ของคุณ ไม่ว่าจะเป็น HIIT, Yoga หรือ BodyCombat",
    href: "/classes",
  },
  {
    image: "/images/exp-clubs.jpg",
    title: "ค้นหาคลับใกล้บ้านคุณ มากกว่า 60 สาขา",
    body: "สะดวกทุกการเดินทาง ติด BTS/MRT มีที่จอดรถสะดวกสบาย พร้อมให้คุณฟิตได้ทุกเวลา",
    href: "/clubs",
  },
  {
    image: "/images/exp-trainer.jpg",
    title: "ผู้ฝึกสอนส่วนบุคคลมืออาชีพ",
    body: "ผู้เชี่ยวชาญพร้อมออกแบบโปรแกรมออกกำลังกายและโภชนาการให้เข้ากับเป้าหมายคุณโดยเฉพาะ",
    href: "#coaches",
  },
  {
    image: "/images/exp-benefits.jpg",
    title: "สิทธิประโยชน์สำหรับสมาชิก",
    body: "รับส่วนลดร้านอาหารสุขภาพ สปา และสิทธิเข้าใช้อีกกว่า 300 สาขาทั่วโลก",
    href: "/#membership",
  },
  {
    image: "/images/exp-schedule.jpg",
    title: "ตารางคลาสและสำรองที่นั่ง",
    body: "ตรวจสอบตารางคลาสประจำสัปดาห์แบบเรียลไทม์ จองง่ายผ่านระบบออนไลน์ ไม่พลาดทุกการเบิร์น",
    href: "/classes",
  },
  {
    image: "/images/exp-contact.jpg",
    title: "ติดต่อและสอบถามข้อมูล",
    body: "มีคำถามเกี่ยวกับแพ็กเกจ หรือต้องการความช่วยเหลือเรื่องการใช้งาน ทีมงานพร้อมดูแลตลอด 24 ชั่วโมง",
    href: "/contact",
  },
];

const PLATFORM = [
  {
    tag: "OOP Design Pattern",
    icon: CreditCard,
    title: "Payment Factory",
    body: "โรงงานสร้างธุรกรรมเลือกช่องทางชำระเงินให้อัตโนมัติ ทั้งบัตรเครดิตและ PromptPay QR โดยไม่ต้องแก้โค้ดฝั่งธุรกิจ",
    code: "PaymentFactory.Create(PaymentMethod.PromptPay)",
  },
  {
    tag: "Behavioral Pattern",
    icon: Sparkles,
    title: "IDiscountStrategy",
    body: "กลยุทธ์ส่วนลดถูกคำนวณฝั่งเซิร์ฟเวอร์ แล้วเลือกข้อเสนอที่คุ้มที่สุดให้สมาชิกก่อนบันทึกยอดสุทธิ",
    code: "strategies.Max(s => s.ComputeDiscount(plan))",
  },
  {
    tag: "Concurrency Safe",
    icon: CalendarClock,
    title: "Conflict-Free Trainer Slot",
    body: "ดัชนี Unique ระดับฐานข้อมูลกันการจองชนกันของเทรนเนอร์ แม้เกิด race condition ก็จองซ้ำไม่ได้",
    code: "UNIQUE (TrainerId, StartTime)",
  },
  {
    tag: "Security",
    icon: ShieldCheck,
    title: "JWT + BCrypt RBAC",
    body: "แยกสิทธิ์การเข้าถึงของสมาชิก เทรนเนอร์ และผู้ดูแลระบบอย่างเด็ดขาดด้วย JWT และรหัสผ่านแบบแฮช",
    code: "[Authorize(Roles = \"ADMIN\")]",
  },
  {
    tag: "Asset Lifecycle",
    icon: Wrench,
    title: "Equipment Maintenance",
    body: "สมาชิกแจ้งอุปกรณ์ชำรุดได้ในสองคลิก ผู้ดูแลรับงาน มอบหมายช่าง และปิดงานพร้อมบันทึกค่าซ่อม",
    code: "MaintenanceRequest → RESOLVED",
  },
  {
    tag: "Analytics",
    icon: LineChart,
    title: "Revenue Aggregation",
    body: "สรุปรายได้ย้อนหลัง 6 เดือน จำนวนสมาชิกที่ยังใช้งาน และอัตราการใช้พื้นที่ ประมวลผลฝั่งเซิร์ฟเวอร์ทั้งหมด",
    code: "GROUP BY DATE_TRUNC('month', PaidAt)",
  },
];

const PORTALS = [
  {
    href: "/member",
    eyebrow: "พอร์ทัลสมาชิก",
    title: "จองเทรนเนอร์และจัดการแพ็กเกจ",
    body: "ดูเซสชันคงเหลือ จองคิวเทรนเนอร์ และตรวจสอบประวัติการชำระเงินได้ในที่เดียว",
  },
  {
    href: "/trainer",
    eyebrow: "พอร์ทัลเทรนเนอร์",
    title: "ตารางสอนและดูแลลูกค้า",
    body: "ตารางนัดหมายรายวัน เป้าหมายของลูกค้า และเครื่องมือออกโปรแกรมฝึกในหน้าจอเดียว",
  },
  {
    href: "/admin",
    eyebrow: "พอร์ทัลผู้ดูแลระบบ",
    title: "ศูนย์ควบคุมการปฏิบัติการ",
    body: "รายได้ สุขภาพสมาชิก สถานะอุปกรณ์ และคิวงานซ่อมบำรุงแบบเรียลไทม์",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1 pt-27">
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden bg-carbon-900">
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-[position:70%_center]"
            style={{ backgroundImage: "url(/images/hero-gym.jpg)" }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(17,17,22,0.96) 0%, rgba(17,17,22,0.88) 40%, rgba(17,17,22,0.6) 100%), radial-gradient(70% 90% at 85% 15%, rgba(230,27,35,0.3) 0%, transparent 60%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-18deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 2px, transparent 2px, transparent 26px)",
            }}
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:py-20">
            <div className="animate-rise space-y-5 text-white lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-pulse-500 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em]">
                <span className="size-2 animate-pulse rounded-full bg-white" />
                Promotion of the month
              </span>

              <div>
                <h2 className="jersey font-display text-3xl font-extrabold leading-tight drop-shadow-sm sm:text-5xl">
                  Your Stronger Season
                </h2>
                <h1 className="jersey font-display text-[44px] font-extrabold leading-[0.95] text-pulse-500 drop-shadow-md sm:text-[76px]">
                  Starts Now!
                </h1>
              </div>

              <div className="flex flex-wrap items-baseline gap-3">
                <p className="font-display text-xl font-bold">ถึงเวลาฟิตกว่าเดิม</p>
                <span className="rounded-lg bg-pulse-500 px-4 py-1.5 font-display text-lg font-bold tracking-tight">
                  เริ่มต้นเพียง 3,990 บ. / เดือน*
                </span>
              </div>

              <ul className="space-y-2.5 pt-1">
                {HERO_BULLETS.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-[15px] text-white/95">
                    <Check className="mt-1 size-4 shrink-0 text-pulse-500" />
                    {bullet}
                  </li>
                ))}
              </ul>

              <p className="inline-block rounded-lg bg-white/10 px-3.5 py-2 text-xs text-ash-500 backdrop-blur">
                <span className="font-bold text-pulse-200">*แพ็กเกจ Stay Fit Monthly</span>{" "}
                สมัครออนไลน์วันนี้ รับสิทธิ์ทันที
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <LinkButton href="/register" size="lg" className="group">
                  สมัครสมาชิกออนไลน์
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </LinkButton>
                <LinkButton href="#membership" variant="carbon" size="lg" className="bg-white !text-carbon-900 hover:bg-ash-200">
                  ดูแพ็กเกจทั้งหมด
                </LinkButton>
              </div>
            </div>

            {/* Welcome-kit card */}
            <div
              className="animate-rise lg:col-span-5 lg:justify-self-end"
              style={{ animationDelay: "120ms" }}
            >
              <div className="relative w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
                <span className="absolute -right-3 -top-3 rounded-full bg-pulse-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                  Free welcome kit
                </span>

                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-xl bg-pulse-50 text-pulse-500">
                    <Gift className="size-6" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-carbon-500">
                      ของสมนาคุณพิเศษ
                    </p>
                    <h3 className="font-display text-lg font-bold text-carbon-900">
                      TP Fitness Gym Gear Pack
                    </h3>
                  </div>
                </div>

                <div className="relative h-36 overflow-hidden rounded-xl bg-ash-100">
                  <Image
                    src="/images/gear-pack.jpg"
                    alt="ชุด TP Fitness Gym Gear Pack: กระเป๋าดัฟเฟิล กระบอกน้ำ และผ้าขนหนู"
                    fill
                    sizes="384px"
                    className="object-cover"
                    priority
                  />
                </div>

                <p className="text-sm leading-relaxed text-carbon-500">
                  รับฟรีทันที! กระเป๋าดัฟเฟิล TP Fitness + กระบอกน้ำเก็บความเย็น + ผ้าขนหนูไมโครไฟเบอร์
                  รวมมูลค่า 1,890 บาท เมื่อลงทะเบียนสมาชิกออนไลน์วันนี้
                </p>

                <div className="flex items-center justify-between border-t border-ash-300 pt-3 text-sm">
                  <span className="flex items-center gap-1.5 font-bold text-jade-500">
                    <span className="size-2 rounded-full bg-jade-500" /> สิทธิ์คงเหลือ 48 ท่านแรก
                  </span>
                  <span className="font-mono text-xs text-carbon-500">CODE: FP2026</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Quick stats ---------- */}
        <section className="bg-pulse-500 py-6 text-white shadow-lg">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-5 sm:px-8 md:grid-cols-4">
            {QUICK_STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3.5">
                <Icon className="size-9 shrink-0" />
                <div className="min-w-0">
                  <p className="font-display text-xl font-extrabold">{value}</p>
                  <p className="text-[11px] leading-tight text-white/85">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <PricingSection />

        {/* ---------- Experience ---------- */}
        <section id="clubs" className="border-y border-ash-300 bg-white py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <SectionTitle
              eyebrow="TP Fitness Experience"
              title="สำรวจบริการและบรรยากาศคลับ"
              description="พื้นที่ฝึกซ้อมสามชั้นที่ออกแบบมาเพื่อคนทำงานกะดึก ผู้ก่อตั้งธุรกิจ และนักกีฬาที่ไม่ยอมฝึกตามเวลาของคนอื่น"
            />

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {EXPERIENCE.map(({ image, title, body, href }) => (
                <a
                  key={title}
                  href={href}
                  className="group relative block h-72 overflow-hidden rounded-2xl bg-carbon-900 shadow-card focus-pulse"
                >
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 384px, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-carbon-900 via-carbon-900/60 to-transparent"
                  />
                  <div className="relative flex h-full flex-col justify-end gap-2 p-6 text-white">
                    <h3 className="font-display text-lg font-bold leading-snug">{title}</h3>
                    <p className="line-clamp-2 text-sm text-ash-400">{body}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-pulse-300 transition-transform group-hover:translate-x-1">
                      ดูเพิ่มเติม <ArrowRight className="size-4" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <CoachesSection />

        {/* ---------- Platform ---------- */}
        <section id="platform" className="bg-carbon-900 py-20 text-white">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="slash mb-3 text-xs font-bold uppercase tracking-[0.16em] text-pulse-500">
              TP Fitness Core Engine · .NET 8 · Next.js · PostgreSQL
            </p>
            <h2 className="max-w-3xl font-display text-[26px] font-extrabold tracking-tight sm:text-4xl">
              สถาปัตยกรรมของระบบบริหารจัดการคลับ 24 ชม.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-ash-500">
              เว็บไซต์นี้ไม่ได้เป็นเพียงหน้าโปรโมชัน แต่ทำงานอยู่บน ASP.NET Core API ตัวเดียวกับที่ให้บริการพอร์ทัลทั้งสาม
              พร้อมดีไซน์แพตเทิร์นเชิงวัตถุที่ใช้งานจริง
            </p>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {PLATFORM.map(({ icon: Icon, tag, title, body, code }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-carbon-700 bg-carbon-800 p-6 transition-colors hover:border-pulse-500"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-pulse-500/15 text-pulse-500">
                      <Icon className="size-5" />
                    </span>
                    <span className="rounded-full bg-carbon-700 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ash-500">
                      {tag}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold">{title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ash-500">{body}</p>
                  <code className="mt-4 block overflow-x-auto rounded-lg bg-carbon-950 px-3 py-2 font-mono text-[11px] text-jade-400">
                    {code}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Portals ---------- */}
        <section id="experience" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <SectionTitle
            align="center"
            eyebrow="Three portals, one system"
            title="พอร์ทัลที่ใช้ระบบเดียวกัน"
            description="ทุกบทบาทเห็นเฉพาะข้อมูลที่จำเป็นต่อหน้าที่ของตนเอง ผ่านสิทธิ์การเข้าถึงที่แยกขาดจากกัน"
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {PORTALS.map((portal) => (
              <a
                key={portal.href}
                href={portal.href}
                className="surface group flex flex-col gap-3 p-7 transition-all duration-200 hover:border-pulse-500 hover:shadow-pulse focus-pulse"
              >
                <Badge tone="pulse">{portal.eyebrow}</Badge>
                <span className="font-display text-xl font-bold text-carbon-900">{portal.title}</span>
                <span className="text-sm leading-relaxed text-carbon-500">{portal.body}</span>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-pulse-500">
                  เข้าสู่พอร์ทัล
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section id="trial" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
          <div className="relative grid overflow-hidden rounded-2xl bg-carbon-900 text-white shadow-pulse lg:grid-cols-[1fr_1.1fr]">
            <div className="relative hidden min-h-[22rem] lg:block">
              <Image
                src="/images/trial-pass.jpg"
                alt="สมาชิกกำลังออกกำลังกายในคลาสสเต็ปแอโรบิก"
                fill
                sizes="560px"
                className="object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-carbon-900/80 via-transparent to-transparent" />
              <span className="absolute bottom-6 left-6 rounded-full bg-pulse-500 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em]">
                3-Day Free Pass
              </span>
            </div>
            <div className="kinetic-band kinetic-grid relative px-8 py-14 text-center sm:px-14 lg:text-left">
              <span className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] lg:hidden">
                3-Day Free Pass
              </span>
              <h2 className="mt-5 font-display text-[28px] font-extrabold tracking-tight sm:text-4xl lg:mt-0">
                ทดลองเล่นฟรี 3 วัน ไม่ต้องใช้บัตรเครดิต
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/90 lg:mx-0">
                เดินชมพื้นที่ฝึก จองเทรนเนอร์ และลองใช้ห้องฟื้นฟูร่างกาย
                ถ้ายังไม่ใช่ชั่วโมงที่ดีที่สุดของวัน คุณเดินออกได้ทันที
              </p>
              <div className="mt-7">
                <TrialForm />
              </div>
              <p className="mt-5 text-sm text-white/90">
                เป็นสมาชิกอยู่แล้ว?{" "}
                <a href="/login" className="font-bold underline underline-offset-4 hover:text-white">
                  เข้าสู่ระบบ
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </>
  );
}
