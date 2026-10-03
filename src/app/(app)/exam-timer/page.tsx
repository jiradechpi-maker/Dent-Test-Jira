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
          "ใส่เวลาสอบตามตาราง แล้วกดเริ่ม · จอแสดงข้อปฏิบัติก่อนเริ่มสอบ และกติกาเข้า–ออกห้อง · เตือนเมื่อเหลือ 5 นาที · กด F เพื่อแสดงเต็มจอบนโปรเจกเตอร์",
          "Enter the scheduled times and press start · the screen shows the exam rules before the start and the door rules during it · a 5-minute warning · press F for full screen on the projector",
        )}
        className="mb-5"
      />
      <ExamTimer />
    </PageContainer>
  );
}
