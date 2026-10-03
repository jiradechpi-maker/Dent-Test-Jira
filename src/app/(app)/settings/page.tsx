import type { Metadata } from "next";
import { Settings, ShieldCheck } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceStatusList } from "@/components/system/service-status";
import { ROLES } from "@/config/master-data";
import { getNavItem } from "@/config/navigation";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t(getNavItem("settings").label) };
}

export default async function SettingsPage() {
  const t = await getT();

  return (
    <PageContainer>
      <PageHeader
        icon={Settings}
        title={t(getNavItem("settings").label)}
        description={t("สถานะบริการและสิทธิ์การใช้งาน", "Service status and user permissions")}
        className="mb-5"
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("สถานะบริการ", "Service status")}</CardTitle>
              <CardDescription>
                {t("บริการแปลง PDF ตั้งค่าด้วยตัวแปร", "The PDF conversion service is configured with the environment variable")}{" "}
                <code className="font-mono text-[11px]">GOTENBERG_URL</code>
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
                <ShieldCheck className="size-4 text-brand-600" aria-hidden /> {t("บทบาทผู้ใช้ (RBAC)", "User roles (RBAC)")}
              </CardTitle>
              <CardDescription>
                {t(
                  "การล็อกอินและกำหนดสิทธิ์จะเปิดใช้พร้อมฐานข้อมูล (Phase 1)",
                  "Sign-in and permission management will be enabled with the database (Phase 1)",
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {ROLES.map((role) => (
                <li key={role.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                  <span className="font-medium text-neutral-800">{role.label}</span>
                  <span className="text-right text-xs text-muted-foreground">{t(role.description)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
