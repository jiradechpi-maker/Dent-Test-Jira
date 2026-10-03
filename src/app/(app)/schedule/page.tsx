import type { Metadata } from "next";
import { getNavItem } from "@/config/navigation";
import { getT } from "@/lib/i18n/server";
import { ScheduleScreen } from "@/components/schedule/schedule-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t(getNavItem("schedule").label) };
}

export default function Page() {
  return <ScheduleScreen />;
}
