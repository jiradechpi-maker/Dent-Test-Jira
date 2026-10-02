import type { Metadata } from "next";
import { ScheduleScreen } from "@/components/schedule/schedule-screen";

export const metadata: Metadata = { title: "ตารางสอนชั้นปี 4" };

export default function Page() {
  return <ScheduleScreen />;
}
