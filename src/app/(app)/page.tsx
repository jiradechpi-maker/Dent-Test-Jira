import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { Dashboard } from "@/components/dashboard/dashboard";

export const metadata: Metadata = { title: "แดชบอร์ด" };

export default function HomePage() {
  return (
    <PageContainer>
      <PageHeader icon={LayoutDashboard} title="แดชบอร์ด" description="งานสนับสนุนวิชาการ คณะทันตแพทยศาสตร์ สจล." className="mb-5" />
      <Dashboard />
    </PageContainer>
  );
}
