import type { Metadata } from "next";
import { CourseCatalogScreen } from "@/components/courses/course-catalog-screen";

export const metadata: Metadata = { title: "รายวิชาในหลักสูตร" };

export default function CoursesPage() {
  return <CourseCatalogScreen />;
}
