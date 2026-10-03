import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { getNavItem } from "@/config/navigation";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { Dashboard } from "@/components/dashboard/dashboard";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t(getNavItem("dashboard").label) };
}

export default async function HomePage() {
  const t = await getT();
  return (
    <PageContainer>
      <PageHeader
        icon={LayoutDashboard}
        title={t(getNavItem("dashboard").label)}
        description={t("งานสนับสนุนวิชาการ คณะทันตแพทยศาสตร์ สจล.", "Academic support · Faculty of Dentistry, KMITL")}
        className="mb-5"
      />
      <Dashboard />
    </PageContainer>
  );
}
