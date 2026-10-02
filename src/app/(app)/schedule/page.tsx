import type { Metadata } from "next";
import { PlannedModule } from "@/components/common/planned-module";

export const metadata: Metadata = { title: "ตารางสอนหลัก" };

export default function Page() {
  return <PlannedModule id="schedule" />;
}
