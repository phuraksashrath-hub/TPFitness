import type { Metadata } from "next";
import { Anybody, Noto_Sans_Thai, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

// Anybody and Outfit carry no Thai glyphs, so Thai copy falls through to this face.
const notoThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TP Fitness — 24 Hour Performance · ระบบบริหารจัดการฟิตเนสครบวงจร",
  description:
    "ฟิตเนส 24 ชั่วโมงพร้อมระบบบริหารจัดการสมาชิก จองเทรนเนอร์ ดูแลอุปกรณ์ และชำระเงินในที่เดียว",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className={`${outfit.variable} ${anybody.variable} ${notoThai.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ash-50 text-carbon-900">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
