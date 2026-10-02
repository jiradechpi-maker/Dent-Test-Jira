import type { Metadata } from "next";
import { PlannedModule } from "@/components/common/planned-module";

export const metadata: Metadata = { title: "คลังข้อสอบ" };

export default function Page() {
  return <PlannedModule id="exam-papers" />;
}
