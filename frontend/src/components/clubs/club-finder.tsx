"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, MapPin, Navigation, Phone, Search } from "lucide-react";
import { branchApi } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import type { Branch } from "@/lib/types";
import { Card, EmptyState } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";

const mapsUrl = (b: Branch) =>
  b.latitude !== null && b.longitude !== null
    ? `https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name} ${b.address}`)}`;

/** Public club finder: search by name, district or province; results grouped by province. */
export function ClubFinder() {
  const [search, setSearch] = useState("");
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      branchApi
        .list(search.trim() || undefined)
        .then((list) => {
          setBranches(list);
          setError(null);
        })
        .catch((err) => {
          setBranches([]);
          setError(apiErrorMessage(err, "ไม่สามารถโหลดรายชื่อสาขาได้"));
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Branch[]>();
    for (const b of branches ?? []) map.set(b.province, [...(map.get(b.province) ?? []), b]);
    return [...map.entries()];
  }, [branches]);

  return (
    <div>
      <div className="max-w-md">
        <Input
          label="ค้นหาสาขา"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ชื่อสาขา เขต หรือจังหวัด เช่น เชียงใหม่"
        />
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-carbon-500">
        <Search className="size-3.5" />
        {branches ? `พบ ${branches.length} สาขา` : "กำลังค้นหา…"}
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-ember-600">
          {error}
        </p>
      )}

      {!branches && (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {branches?.length === 0 && !error && (
        <div className="mt-6">
          <EmptyState
            icon={<MapPin className="size-7" />}
            title="ไม่พบสาขาที่ตรงกับคำค้น"
            description="ลองค้นด้วยชื่อจังหวัดหรือเขต หรือล้างช่องค้นหาเพื่อดูทุกสาขา"
          />
        </div>
      )}

      {grouped.map(([province, list]) => (
        <section key={province} className="mt-8" aria-label={province}>
          <h2 className="font-display text-xl font-extrabold text-carbon-900">
            {province} <span className="text-sm font-semibold text-carbon-500">({list.length} สาขา)</span>
          </h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {list.map((b) => (
              <Card key={b.id} className="flex flex-col p-6">
                <h3 className="font-display text-lg font-bold text-carbon-900">{b.name}</h3>
                <p className="mt-1 flex items-start gap-2 text-sm text-carbon-500">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-pulse-500" /> {b.address}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-carbon-700">
                  <Clock className="size-4 shrink-0 text-pulse-500" /> {b.openingHours}
                </p>
                {b.phone && (
                  <a
                    href={`tel:${b.phone}`}
                    className="mt-1 flex min-h-10 items-center gap-2 text-sm font-semibold text-carbon-700 hover:text-pulse-600"
                  >
                    <Phone className="size-4 shrink-0 text-pulse-500" /> {b.phone}
                  </a>
                )}
                {b.facilities.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {b.facilities.map((f) => (
                      <Badge key={f} tone="ash">
                        {f}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-5 flex flex-1 items-end gap-2">
                  <a
                    href={mapsUrl(b)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-pulse-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pulse-600 focus-pulse"
                  >
                    <Navigation className="size-4" /> เปิดแผนที่
                  </a>
                  <Link
                    href={`/classes?branch=${b.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ash-400 px-4 py-2.5 text-sm font-bold text-carbon-700 transition-colors hover:border-pulse-500 hover:text-pulse-600 focus-pulse"
                  >
                    <CalendarDays className="size-4" /> ดูคลาส
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
