"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock, ScanLine, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const GRID = 21;
const REFRESH_SECONDS = 30;

/** Deterministic 32-bit hash so the same payload always renders the same matrix. */
function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function isFinderCell(row: number, col: number) {
  const inBox = (r0: number, c0: number) =>
    row >= r0 && row < r0 + 7 && col >= c0 && col < c0 + 7;
  const onRing = (r0: number, c0: number) => {
    const dr = row - r0;
    const dc = col - c0;
    const edge = dr === 0 || dr === 6 || dc === 0 || dc === 6;
    const core = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
    return edge || core;
  };

  for (const [r0, c0] of [
    [0, 0],
    [0, GRID - 7],
    [GRID - 7, 0],
  ]) {
    if (inBox(r0, c0)) return onRing(r0, c0);
  }
  return null;
}

/**
 * Visual door pass modelled on the stitch member portal. The matrix is a
 * deterministic rendering of the pass payload, not a scannable QR symbol — the
 * turnstile reads the payload string itself.
 */
export function TouchlessPass({
  memberId,
  memberName,
  lockerCode,
}: {
  memberId: number;
  memberName: string;
  lockerCode?: string | null;
}) {
  const [cycle, setCycle] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setCycle((c) => c + 1);
          return REFRESH_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const payload = `FP-${memberId.toString().padStart(5, "0")}-${cycle}`;

  const cells = useMemo(() => {
    const seed = hash(payload);
    return Array.from({ length: GRID * GRID }, (_, index) => {
      const row = Math.floor(index / GRID);
      const col = index % GRID;
      const finder = isFinderCell(row, col);
      if (finder !== null) return finder;
      return ((hash(`${seed}:${row}:${col}`) >>> 3) & 1) === 1;
    });
  }, [payload]);

  return (
    <div className="self-start overflow-hidden rounded-2xl bg-carbon-900 text-white shadow-bar">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <p className="flex items-center gap-2 font-display text-sm font-bold tracking-tight">
          <ScanLine className="size-4 text-pulse-500" />
          TP FITNESS TOUCHLESS PASS
        </p>
        <Badge tone="jade">Online</Badge>
      </div>

      <div className="bg-white px-5 py-6 text-center text-carbon-900">
        <div className="relative mx-auto w-fit rounded-xl border border-ash-300 p-4">
          <div
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: `repeat(${GRID}, 0.55rem)` }}
            role="img"
            aria-label={`รหัสเข้าคลับของ ${memberName}`}
          >
            {cells.map((filled, index) => (
              <span
                key={index}
                className={filled ? "size-[0.55rem] bg-carbon-900" : "size-[0.55rem] bg-transparent"}
              />
            ))}
          </div>
          <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl border-4 border-white bg-pulse-500 text-white">
            <Zap className="size-5" />
          </span>
        </div>

        <p className="mt-4 text-xs font-semibold text-pulse-500">
          รหัสจะรีเฟรชอัตโนมัติใน {secondsLeft} วินาที
        </p>
        <p className="mt-1 font-mono text-xs text-carbon-500">{payload}</p>
        <p className="mt-3 text-sm font-semibold text-carbon-900">
          สแกนเพื่อเข้าประตูคลับและล็อกเกอร์
        </p>
        <p className="mt-1 text-xs leading-relaxed text-carbon-500">
          ใช้รหัสนี้ที่ประตูหมุนของทุกสาขา TP Fitness หรือแตะที่ตู้ Smart Locker เพื่อเปิดใช้งาน
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 bg-ash-100 px-5 py-3 text-carbon-900">
        <span className="flex items-center gap-2 text-xs font-semibold text-carbon-500">
          <Lock className="size-3.5" /> ล็อกเกอร์ประจำตัว
        </span>
        <span className="font-display text-sm font-bold text-pulse-500">
          {lockerCode ?? "ยังไม่ได้กำหนด"}
        </span>
      </div>
    </div>
  );
}
