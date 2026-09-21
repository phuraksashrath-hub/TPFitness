"use client";

import { Suspense } from "react";
import { PageHeading } from "@/components/portal/portal-shell";
import { ClassTimetable } from "@/components/classes/class-timetable";
import { Skeleton } from "@/components/ui/primitives";

export default function MemberClassesPage() {
  return (
    <>
      <PageHeading
        eyebrow="Group Classes"
        title="คลาสกรุ๊ปและที่นั่งของคุณ"
        description="จองที่นั่งคลาสล่วงหน้า 14 วัน ที่นั่งมีจำกัด ยกเลิกได้ล่วงหน้าอย่างน้อย 2 ชั่วโมงก่อนเริ่มคลาส"
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ClassTimetable loginPath="/member/classes" />
      </Suspense>
    </>
  );
}
