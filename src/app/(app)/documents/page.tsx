import type { Metadata } from "next";
import { PlannedModule } from "@/components/common/planned-module";

export const metadata: Metadata = { title: "คลังเอกสาร" };

export default function Page() {
  return <PlannedModule id="documents" />;
}
