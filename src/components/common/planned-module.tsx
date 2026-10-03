import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, Timer } from "lucide-react";
import { getNavItem } from "@/config/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { PageContainer, PageHeader } from "./page-header";

/** Empty state for modules scheduled in a later phase — explains what is coming and offers working tools. */
export async function PlannedModule({ id }: { id: string }) {
  const item = getNavItem(id);
  const t = await getT();

  return (
    <PageContainer>
      <PageHeader
        icon={item.icon}
        title={t(item.label)}
        description={t(item.description)}
        actions={<Badge tone="brand">{t("กำลังพัฒนา", "In development")} · Phase {item.phase}</Badge>}
      />
      <Card className="mt-6 overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
          <div className="p-6 sm:p-8">
            <h2 className="text-base font-semibold text-neutral-900">{t(`โมดูลนี้จะเปิดใช้งานใน Phase ${item.phase}`, `This module opens in Phase ${item.phase}`)}</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">{t("ความสามารถที่วางแผนไว้:", "Planned features:")}</p>
            <ul className="mt-4 space-y-2.5">
              {(item.features ?? []).map((feature) => (
                <li key={feature.en} className="flex items-start gap-2.5 text-[13px] text-neutral-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden />
                  {t(feature)}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-border bg-neutral-50 p-6 sm:p-8 md:border-t-0 md:border-l">
            <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">{t("ใช้งานได้แล้ววันนี้", "Available today")}</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/documents/invitations" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "justify-start")}>
                <Mail aria-hidden /> {t("ออกหนังสือเชิญอาจารย์พิเศษ", "Issue a guest lecturer invitation")}
                <ArrowRight className="ml-auto" aria-hidden />
              </Link>
              <Link href="/exam-timer" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "justify-start")}>
                <Timer aria-hidden /> {t("นาฬิกาจับเวลาสอบ", "Exam timer")}
                <ArrowRight className="ml-auto" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
