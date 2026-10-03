import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { getNavItem } from "@/config/navigation";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { InvitationBuilder } from "@/components/documents/invitation-builder";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t(getNavItem("invitations").label) };
}

export default async function InvitationsPage() {
  const t = await getT();
  return (
    <PageContainer className="max-w-[1600px]">
      <PageHeader
        icon={Mail}
        title={t(getNavItem("invitations").label)}
        description={t(
          "กรอกข้อมูลครั้งเดียว ได้หนังสือราชการ + เอกสารแนบตารางสอน ตามแบบฟอร์มคณะทุกตัวอักษร (TH SarabunPSK 16pt · ตรา สจล.)",
          "Enter the details once to get the official letter and its teaching-schedule attachment, laid out exactly like the faculty template. The letter itself is in Thai (TH SarabunPSK 16 pt · KMITL emblem).",
        )}
        className="mb-5"
      />
      <InvitationBuilder />
    </PageContainer>
  );
}
