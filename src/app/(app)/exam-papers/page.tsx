import type { Metadata } from "next";
import { PlannedModule } from "@/components/common/planned-module";
import { getNavItem } from "@/config/navigation";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t(getNavItem("exam-papers").label) };
}

export default function Page() {
  return <PlannedModule id="exam-papers" />;
}
