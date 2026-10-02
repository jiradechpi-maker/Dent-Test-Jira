import type { Metadata } from "next";
import { InvigilatorsScreen } from "@/components/invigilators/invigilators-screen";

export const metadata: Metadata = { title: "ชั่วโมงคุมสอบ" };

export default function Page() {
  return <InvigilatorsScreen />;
}
