import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { InvitationBuilder } from "@/components/documents/invitation-builder";

export const metadata: Metadata = { title: "หนังสือเชิญอาจารย์พิเศษ" };

export default function InvitationsPage() {
  return (
    <PageContainer className="max-w-[1600px]">
      <PageHeader
        icon={Mail}
        title="หนังสือเชิญอาจารย์พิเศษ"
        description="กรอกข้อมูลครั้งเดียว ได้หนังสือราชการ + เอกสารแนบตารางสอน ตามแบบฟอร์มคณะทุกตัวอักษร (TH SarabunPSK 16pt · ตรา สจล.)"
        className="mb-5"
      />
      <InvitationBuilder />
    </PageContainer>
  );
}
