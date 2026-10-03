import type { Metadata } from "next";
import { getNavItem } from "@/config/navigation";
import { InvigilatorsScreen } from "@/components/invigilators/invigilators-screen";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t(getNavItem("invigilators").label) };
}

export default function Page() {
  return <InvigilatorsScreen />;
}
