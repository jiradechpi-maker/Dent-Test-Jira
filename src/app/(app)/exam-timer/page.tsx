import type { Metadata } from "next";
import { Timer } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { ExamTimer } from "@/components/exam-timer/exam-timer";

export const metadata: Metadata = { title: "นาฬิกาจับเวลาสอบ" };

export default function ExamTimerPage() {
  return (
    <PageContainer>
      <PageHeader
        icon={Timer}
        title="นาฬิกาจับเวลาสอบ"
        description="ใส่เวลาสอบตามตาราง (เช่น 09:00–12:00) จอแสดงเวลาสอบ ระยะเวลารวม เวลาที่เหลือ และกติกาเข้า-ออกห้องสอบ · กด F เพื่อแสดงเต็มจอบนโปรเจกเตอร์"
        className="mb-5"
      />
      <ExamTimer />
    </PageContainer>
  );
}
