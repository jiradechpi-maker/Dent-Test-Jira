import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, Timer } from "lucide-react";
import { getNavItem } from "@/config/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "./page-header";

/** Empty state for modules scheduled in a later phase — explains what is coming and offers working tools. */
export function PlannedModule({ id }: { id: string }) {
  const item = getNavItem(id);

  return (
    <PageContainer>
      <PageHeader
        icon={item.icon}
        title={item.label}
        description={item.description}
        actions={<Badge tone="brand">กำลังพัฒนา · Phase {item.phase}</Badge>}
      />
      <Card className="mt-6 overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
          <div className="p-6 sm:p-8">
            <h2 className="text-base font-semibold text-neutral-900">โมดูลนี้จะเปิดใช้งานใน Phase {item.phase}</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">ความสามารถที่วางแผนไว้:</p>
            <ul className="mt-4 space-y-2.5">
              {(item.features ?? []).map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-[13px] text-neutral-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-border bg-neutral-50 p-6 sm:p-8 md:border-t-0 md:border-l">
            <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">ใช้งานได้แล้ววันนี้</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/documents/invitations" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "justify-start")}>
                <Mail aria-hidden /> ออกหนังสือเชิญอาจารย์พิเศษ
                <ArrowRight className="ml-auto" aria-hidden />
              </Link>
              <Link href="/exam-timer" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "justify-start")}>
                <Timer aria-hidden /> นาฬิกาจับเวลาสอบ
                <ArrowRight className="ml-auto" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
