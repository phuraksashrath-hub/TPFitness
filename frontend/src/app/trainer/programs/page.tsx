"use client";

import { useCallback, useEffect, useState } from "react";
import { Dumbbell, Plus, Trash2 } from "lucide-react";
import { memberApi, programApi, type SaveProgramPayload } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api";
import type { UserProfile, WorkoutProgram } from "@/lib/types";
import { DAY_LABELS, formatDate } from "@/lib/format";
import { PageHeading } from "@/components/portal/portal-shell";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/card";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

type ExerciseDraft = SaveProgramPayload["exercises"][number];

const emptyExercise: ExerciseDraft = {
  name: "",
  dayOfWeek: 1,
  sets: 3,
  reps: 10,
  weightKg: null,
  restSeconds: 90,
  notes: "",
};

export default function TrainerProgramsPage() {
  const toast = useToast();
  const [programs, setPrograms] = useState<WorkoutProgram[] | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState({
    memberId: 0,
    title: "",
    goal: "",
    description: "",
    durationWeeks: 8,
    difficulty: "BEGINNER",
  });
  const [exercises, setExercises] = useState<ExerciseDraft[]>([{ ...emptyExercise }]);

  const load = useCallback(async () => {
    const [list, memberList] = await Promise.all([
      programApi.mine().catch(() => []),
      memberApi.list().catch(() => []),
    ]);
    setPrograms(list);
    setMembers(memberList);
    setDraft((d) => (d.memberId === 0 && memberList[0] ? { ...d, memberId: memberList[0].id } : d));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateExercise(index: number, patch: Partial<ExerciseDraft>) {
    setExercises((current) => current.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  async function save() {
    if (!draft.memberId || !draft.title.trim()) {
      toast.error("กรุณาเลือกสมาชิกและตั้งชื่อโปรแกรม");
      return;
    }

    setSaving(true);
    try {
      await programApi.create({
        memberId: draft.memberId,
        title: draft.title.trim(),
        goal: draft.goal.trim() || undefined,
        description: draft.description.trim() || undefined,
        durationWeeks: draft.durationWeeks,
        difficulty: draft.difficulty,
        exercises: exercises.filter((e) => e.name.trim()),
      });
      toast.success("ส่งโปรแกรมไปยังแอปของสมาชิกเรียบร้อยแล้ว");
      setOpen(false);
      setExercises([{ ...emptyExercise }]);
      setDraft((d) => ({ ...d, title: "", goal: "", description: "" }));
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถบันทึกโปรแกรมได้"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      await programApi.remove(id);
      toast.success("ลบโปรแกรมเรียบร้อยแล้ว");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "ไม่สามารถลบโปรแกรมได้"));
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Workout Prescription Engine"
        title="ออกโปรแกรมฝึกให้สมาชิก"
        description="เผยแพร่แผนการฝึกแบบสัปดาห์ต่อสัปดาห์ แล้วสมาชิกจะเห็นทันทีในพอร์ทัลของตัวเอง"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> สร้างโปรแกรมใหม่
          </Button>
        }
      />

      {!programs && <Skeleton className="h-80" />}

      {programs?.length === 0 && (
        <EmptyState
          icon={<Dumbbell className="size-7" />}
          title="ยังไม่มีโปรแกรม"
          description="สร้างแผนแรกของคุณ — ระบบจะส่งต่อไปยังพอร์ทัลสมาชิกทันที"
          action={
            <Button size="sm" className="mt-2" onClick={() => setOpen(true)}>
              สร้างโปรแกรม
            </Button>
          }
        />
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {programs?.map((program) => (
          <Card key={program.id}>
            <CardHeader
              title={program.title}
              subtitle={program.goal ?? undefined}
              action={
                <div className="flex items-center gap-2">
                  <StatusBadge value={program.difficulty} />
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`ลบโปรแกรม ${program.title}`}
                    onClick={() => void remove(program.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              }
            />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3 border-b border-ash-300 pb-4">
                <Avatar name={program.memberName} size={34} />
                <div className="text-xs text-carbon-500">
                  <p className="text-sm font-semibold text-carbon-900">{program.memberName}</p>
                  <p>
                    {program.durationWeeks} สัปดาห์ · {program.exercises.length} ท่าฝึก · สร้างเมื่อ{" "}
                    {formatDate(program.createdAt)}
                  </p>
                </div>
              </div>

              <ul className="space-y-2">
                {program.exercises.slice(0, 5).map((exercise) => (
                  <li key={exercise.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-carbon-700">
                      <span className="mr-2 text-xs font-bold text-pulse-500">
                        {DAY_LABELS[exercise.dayOfWeek - 1]}
                      </span>
                      {exercise.name}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-carbon-500">
                      {exercise.sets}×{exercise.reps}
                    </span>
                  </li>
                ))}
                {program.exercises.length > 5 && (
                  <li className="text-xs text-carbon-500">
                    และอีก {program.exercises.length - 5} ท่า
                  </li>
                )}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="สร้างโปรแกรมฝึก"
        description="กำหนดสมาชิกผู้รับโปรแกรม แล้ววางแผนการฝึกตลอดสัปดาห์"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button loading={saving} onClick={() => void save()}>
              ส่งโปรแกรมไปยังสมาชิก
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="เลือกสมาชิกผู้รับโปรแกรม *"
              value={draft.memberId}
              onChange={(e) => setDraft({ ...draft, memberId: Number(e.target.value) })}
            >
              {members.length === 0 && <option value={0}>ไม่พบรายชื่อสมาชิก</option>}
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName} (ID: #FP-{member.id.toString().padStart(5, "0")})
                </option>
              ))}
            </Select>
            <Select
              label="ระดับความยาก"
              value={draft.difficulty}
              onChange={(e) => setDraft({ ...draft, difficulty: e.target.value })}
            >
              {[
                ["BEGINNER", "เริ่มต้น"],
                ["INTERMEDIATE", "ปานกลาง"],
                ["ADVANCED", "ขั้นสูง"],
              ].map(([level, label]) => (
                <option key={level} value={level}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="ชื่อโปรแกรม *"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="12-Week Strength Foundation"
          />
          <Input
            label="เป้าหมายประจำเซสชัน"
            value={draft.goal}
            onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
            placeholder="สร้างพื้นฐากล้ามเนื้อควบคู่กับการลดไขมัน"
          />
          <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
            <Textarea
              label="รายละเอียดโปรแกรม"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="แบ่งบน-ล่าง เน้น Progressive Overload"
            />
            <Input
              label="จำนวนสัปดาห์"
              type="number"
              min={1}
              max={104}
              value={draft.durationWeeks}
              onChange={(e) => setDraft({ ...draft, durationWeeks: Number(e.target.value) })}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-bold tracking-[0.04em] text-carbon-700">
                รายการท่าฝึกออกกำลังกาย (Exercises)
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExercises((c) => [...c, { ...emptyExercise }])}
              >
                <Plus className="size-3.5" /> เพิ่มท่าฝึก
              </Button>
            </div>

            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div key={index} className="rounded-xl border border-ash-300 bg-ash-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
                    <Input
                      label="ชื่อท่า"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, { name: e.target.value })}
                      placeholder="Barbell Back Squat"
                    />
                    <Select
                      label="วัน"
                      value={exercise.dayOfWeek}
                      onChange={(e) => updateExercise(index, { dayOfWeek: Number(e.target.value) })}
                    >
                      {DAY_LABELS.map((label, i) => (
                        <option key={label} value={i + 1}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Input
                      label="เซต"
                      type="number"
                      min={1}
                      value={exercise.sets}
                      onChange={(e) => updateExercise(index, { sets: Number(e.target.value) })}
                    />
                    <Input
                      label="ครั้ง/เซต"
                      type="number"
                      min={1}
                      value={exercise.reps}
                      onChange={(e) => updateExercise(index, { reps: Number(e.target.value) })}
                    />
                    <Input
                      label="น้ำหนัก (กก.)"
                      type="number"
                      min={0}
                      value={exercise.weightKg ?? ""}
                      onChange={(e) =>
                        updateExercise(index, {
                          weightKg: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                    <Input
                      label="พัก (วินาที)"
                      type="number"
                      min={0}
                      value={exercise.restSeconds}
                      onChange={(e) =>
                        updateExercise(index, { restSeconds: Number(e.target.value) })
                      }
                    />
                  </div>

                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setExercises((c) => c.filter((_, i) => i !== index))}
                      className="mt-3 text-xs font-semibold text-ember-500 hover:text-ember-600 focus-pulse"
                    >
                      ลบท่านี้
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
