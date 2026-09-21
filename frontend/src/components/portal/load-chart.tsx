"use client";

import { useMemo } from "react";

const TICKS = [0, 4, 8, 12, 16, 20, 23];

/**
 * 24-hour density curve with the peak hour called out (stitch: "กราฟความหนาแน่นผู้เข้าใช้งานรอบ 24 ชั่วโมง").
 * `values[h]` is the load for hour `h`. Inline SVG, no charting dependency.
 */
export function LoadChart({ values, unit }: { values: number[]; unit: string }) {
  const { path, area, peakIndex, peak, peakX, peakY } = useMemo(() => {
    const width = 100;
    const height = 42;
    const max = Math.max(...values, 1);
    const points = values.map((v, i) => ({
      x: (i / (values.length - 1)) * width,
      y: height - (v / max) * (height - 8) - 2,
    }));
    // Catmull-Rom style smoothing keeps the curve organic without overshooting the baseline.
    const d = points.reduce((acc, p, i, arr) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      const prev = arr[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `${acc} C ${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
    }, "");
    const index = values.indexOf(Math.max(...values));
    return {
      path: d,
      area: `${d} L ${width},${height} L 0,${height} Z`,
      peakIndex: index,
      peak: values[index] ?? 0,
      peakX: points[index]?.x ?? 0,
      peakY: points[index]?.y ?? height,
    };
  }, [values]);

  const hasData = peak > 0;

  return (
    <div>
      <div className="relative">
        <svg
          viewBox="0 0 100 42"
          preserveAspectRatio="none"
          className="h-44 w-full"
          role="img"
          aria-label={hasData ? `ช่วงพีค ${peakIndex}:00 น. จำนวน ${peak} ${unit}` : "ยังไม่มีข้อมูล"}
        >
          <defs>
            <linearGradient id="loadFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e61b23" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#e61b23" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#loadFill)" />
          <path d={path} fill="none" stroke="#e61b23" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
          {hasData && (
            <line
              x1={peakX}
              x2={peakX}
              y1={peakY}
              y2={42}
              stroke="#e61b23"
              strokeWidth="1"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {hasData && (
          <>
            <span
              className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-pulse-500 shadow"
              style={{ left: `${peakX}%`, top: `${(peakY / 42) * 100}%` }}
            />
            <span
              className="absolute -translate-x-1/2 whitespace-nowrap rounded-md bg-carbon-900 px-2.5 py-1 text-[11px] font-bold text-white"
              style={{
                left: `${Math.min(Math.max(peakX, 14), 86)}%`,
                top: `${Math.max((peakY / 42) * 100 - 26, 0)}%`,
              }}
            >
              พีคสุด: {peak} {unit} ({String(peakIndex).padStart(2, "0")}:00 น.)
            </span>
          </>
        )}
      </div>

      <div className="mt-3 flex justify-between text-xs text-carbon-500">
        {TICKS.map((h) => (
          <span key={h} className={h === peakIndex && hasData ? "font-bold text-pulse-500" : undefined}>
            {String(h).padStart(2, "0")}:00
          </span>
        ))}
      </div>
    </div>
  );
}
