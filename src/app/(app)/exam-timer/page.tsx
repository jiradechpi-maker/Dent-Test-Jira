import type { Metadata } from "next";
import { Timer } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { ExamTimer } from "@/components/exam-timer/exam-timer";
import { getNavItem } from "@/config/navigation";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t(getNavItem("exam-timer").label) };
}

export default async function ExamTimerPage() {
  const t = await getT();

  return (
    <PageContainer>
      <PageHeader
        icon={Timer}
        title={t(getNavItem("exam-timer").label)}
        description={t(
          "ใส่เวลาสอบตามตาราง (เช่น 09:00–12:00) จอแสดงเวลาสอบ ระยะเวลารวม เวลาที่เหลือ และกติกาเข้า-ออกห้องสอบ · ประกาศเสียงพูดสองภาษา (ไทย/อังกฤษ) พร้อมคำบรรยายบนจอ เช่น เหลือเวลาสอบอีก 1 ชั่วโมง / 30 นาที / 15 นาที / 5 นาที · กด F เพื่อแสดงเต็มจอบนโปรเจกเตอร์",
          "Enter the scheduled exam time (e.g. 09:00–12:00) — the screen shows the exam window, total duration, time remaining and the rules for entering and leaving the exam room · bilingual (Thai/English) spoken announcements with on-screen captions, e.g. 1 hour, 30, 15 and 5 minutes remaining · press F for full screen on the projector",
        )}
        className="mb-5"
      />
      <ExamTimer />
    </PageContainer>
  );
}
