import type { Metadata } from "next";
import { Settings, ShieldCheck } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceStatusList } from "@/components/system/service-status";
import { ROLES } from "@/config/master-data";

export const metadata: Metadata = { title: "ตั้งค่า" };

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader icon={Settings} title="ตั้งค่า" description="สถานะบริการและสิทธิ์การใช้งาน" className="mb-5" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>สถานะบริการ</CardTitle>
              <CardDescription>
                บริการแปลง PDF ตั้งค่าด้วยตัวแปร <code className="font-mono text-[11px]">GOTENBERG_URL</code>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ServiceStatusList />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-brand-600" aria-hidden /> บทบาทผู้ใช้ (RBAC)
              </CardTitle>
              <CardDescription>การล็อกอินและกำหนดสิทธิ์จะเปิดใช้พร้อมฐานข้อมูล (Phase 1)</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {ROLES.map((role) => (
                <li key={role.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                  <span className="font-medium text-neutral-800">{role.label}</span>
                  <span className="text-right text-xs text-muted-foreground">{role.description}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
