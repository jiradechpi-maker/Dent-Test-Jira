import type { Metadata } from "next";
import { PlannedModule } from "@/components/common/planned-module";

export const metadata: Metadata = { title: "ตารางสอบ" };

export default function Page() {
  return <PlannedModule id="exams" />;
}
