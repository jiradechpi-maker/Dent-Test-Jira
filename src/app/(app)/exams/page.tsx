import type { Metadata } from "next";
import { ExamsScreen } from "@/components/exams/exams-screen";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("ตารางสอบและกรรมการคุมสอบ", "Exams and invigilation") };
}

export default function Page() {
  return <ExamsScreen />;
}
