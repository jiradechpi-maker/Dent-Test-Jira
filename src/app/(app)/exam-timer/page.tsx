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
          "ใส่เวลาสอบตามตาราง แล้วกดเริ่ม · ประกาศเสียงเมื่อเหลือเวลาสอบ 5 นาที (เปิด/ปิดได้) · กด F เพื่อแสดงเต็มจอบนโปรเจกเตอร์",
          "Enter the scheduled times and press start · optional spoken warning at 5 minutes left · press F for full screen on the projector",
        )}
        className="mb-5"
      />
      <ExamTimer />
    </PageContainer>
  );
}
