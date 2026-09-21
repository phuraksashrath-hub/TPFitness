"use client";

import { useMemo } from "react";
import type { RevenuePoint } from "@/lib/types";
import { formatTHB } from "@/lib/format";

/**
 * Lightweight inline area chart. Avoids pulling a charting library for a single
 * six-point series and keeps the Kinetic Pulse red palette consistent.
 */
export function RevenueChart({ points }: { points: RevenuePoint[] }) {
  const { path, area, max } = useMemo(() => {
    const width = 100;
    const height = 42;
    const peak = Math.max(...points.map((p) => p.amount), 1);

    const coords = points.map((point, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * width;
      const y = height - (point.amount / peak) * (height - 4) - 2;
      return `${x},${y}`;
    });

    return {
      path: `M ${coords.join(" L ")}`,
      area: `M 0,${height} L ${coords.join(" L ")} L ${width},${height} Z`,
      max: peak,
    };
  }, [points]);

  return (
    <div>
      <svg
        viewBox="0 0 100 42"
        preserveAspectRatio="none"
        className="h-36 w-full"
        role="img"
        aria-label={`แนวโน้มรายได้ สูงสุด ${formatTHB(max)}`}
      >
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e61b23" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#e61b23" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#revenueFill)" />
        <path
          d={path}
          fill="none"
          stroke="#e61b23"
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-3 flex justify-between text-xs text-carbon-500">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}
