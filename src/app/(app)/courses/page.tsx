import type { Metadata } from "next";
import { CourseCatalogScreen } from "@/components/courses/course-catalog-screen";
import { getNavItem } from "@/config/navigation";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t(getNavItem("courses").label) };
}

export default function CoursesPage() {
  return <CourseCatalogScreen />;
}
