import type { Metadata } from "next";
import { ExamsScreen } from "@/components/exams/exams-screen";

export const metadata: Metadata = { title: "ตารางสอบและกรรมการคุมสอบ" };

export default function Page() {
  return <ExamsScreen />;
}
