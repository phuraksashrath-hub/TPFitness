"use client";

import { useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";
import { programApi } from "@/lib/services";
import type { WorkoutProgram } from "@/lib/types";
import { DAY_LABELS, formatDate } from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/card";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/badge";

export default function MemberProgramsPage() {
  const [programs, setPrograms] = useState<WorkoutProgram[] | null>(null);

  useEffect(() => {
    programApi
      .mine()
      .then(setPrograms)
      .catch(() => setPrograms([]));
  }, []);

  return (
    <>
      <PageHeading
        eyebrow="Training"
        title="โปรแกรมฝึกของฉัน"
        description="ทุกโปรแกรมที่เทรนเนอร์ออกแบบให้คุณโดยเฉพาะ แยกตามวันและสัปดาห์"
      />

      {!programs && <Skeleton className="h-96" />}

      {programs?.length === 0 && (
        <EmptyState
          icon={<Dumbbell className="size-7" />}
          title="ยังไม่มีโปรแกรมฝึก"
          description="หลังเซสชันแรกกับเทรนเนอร์ โปรแกรมที่ออกแบบเฉพาะคุณจะแสดงที่นี่ทันที"
        />
      )}

      <div className="space-y-6">
        {programs?.map((program) => {
          const byDay = DAY_LABELS.map((label, index) => ({
            label,
            exercises: program.exercises.filter((e) => e.dayOfWeek === index + 1),
          })).filter((d) => d.exercises.length > 0);

          return (
            <Card key={program.id}>
              <CardHeader
                title={program.title}
                subtitle={program.goal ?? undefined}
                action={<StatusBadge value={program.difficulty} />}
              />
              <CardBody className="space-y-5">
                <div className="flex flex-wrap items-center gap-4 border-b border-ash-300 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={program.trainerName} size={32} />
                    <span className="text-sm font-semibold text-carbon-900">
                      {program.trainerName}
                    </span>
                  </div>
                  <span className="text-xs text-carbon-500">
                    {program.durationWeeks} สัปดาห์ · สร้างเมื่อ {formatDate(program.createdAt)}
                  </span>
                </div>

                {program.description && (
                  <p className="text-sm leading-relaxed text-carbon-500">{program.description}</p>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {byDay.map((day) => (
                    <div key={day.label} className="rounded-xl border border-ash-300 bg-ash-50 p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-pulse-500">
                        {day.label}
                      </p>
                      <ul className="space-y-2.5">
                        {day.exercises.map((exercise) => (
                          <li
                            key={exercise.id}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-carbon-900">{exercise.name}</p>
                              {exercise.notes && (
                                <p className="truncate text-xs text-carbon-500">{exercise.notes}</p>
                              )}
                            </div>
                            <span className="shrink-0 font-display text-xs font-bold text-pulse-500">
                              {exercise.sets}×{exercise.reps}
                              {exercise.weightKg ? ` @ ${exercise.weightKg} กก.` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
