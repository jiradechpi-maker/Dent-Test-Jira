import type { Metadata } from "next";
import { PlannedModule } from "@/components/common/planned-module";

export const metadata: Metadata = { title: "หาวันว่าง" };

export default function Page() {
  return <PlannedModule id="slot-finder" />;
}
