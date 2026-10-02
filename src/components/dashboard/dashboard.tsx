"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CircleDashed, CheckCircle2, Mail, Timer } from "lucide-react";
import { NAV_ITEMS } from "@/config/navigation";
import { DAY_COLORS } from "@/config/master-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceStatusList } from "@/components/system/service-status";
import { cn } from "@/lib/utils";

const PHASES = [
  { phase: 0, title: "โครงระบบ + Design system + ⌘K", done: true },
  { phase: 1, title: "ฐานข้อมูล + ตารางสอนหลัก + Excel", done: false },
  { phase: 2, title: "Document engine + หนังสือเชิญ (พร้อมใช้ · คลังแม่แบบบน Supabase ตามมากับฐานข้อมูล)", done: true },
  { phase: 3, title: "ตารางสอบ + จัดห้อง + กรรมการคุมสอบ", done: false },
  { phase: 4, title: "คลังข้อสอบ Kanban + T-7 + ใบปะหน้า", done: false },
  { phase: 5, title: "Reconciliation + ใบลงเวลา + ฉบับแก้ไข", done: false },
  { phase: 6, title: "หาวันว่าง + Cascade shift", done: false },
  { phase: 7, title: "ซิงก์ Google Sheets", done: false },
  { phase: 8, title: "รายงาน + เอกสารคู่มือ", done: false },
];

function TodayCard() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  if (!now) return <Skeleton className="h-[120px] w-full rounded-[var(--radius-card)]" />;
  const day = DAY_COLORS[now.getDay()] ?? DAY_COLORS[0];
  const dateText = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(now);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Bangkok" }).format(now));
  const greeting = hour < 12 ? "สวัสดีตอนเช้า" : hour < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";
  return (
    <Card className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: day.hex }} />
      <CardContent className="flex flex-col gap-1 py-5 pl-6">
        <p className="text-xs font-medium text-muted-foreground">{greeting} 👋</p>
        <p className="text-xl font-semibold tracking-tight text-neutral-900">{dateText}</p>
        <p className="mt-1 flex items-center gap-2 text-xs text-neutral-600">
          <span className="inline-block size-3 rounded-full ring-1 ring-black/10" style={{ background: day.hex }} aria-hidden />
          สีประจำวัน{day.name}
        </p>
      </CardContent>
    </Card>
  );
}

const QUICK_ACTIONS = [
  {
    href: "/documents/invitations",
    icon: Mail,
    title: "ออกหนังสือเชิญอาจารย์พิเศษ",
    description: "Word + PDF ตามแบบฟอร์มคณะ พร้อมเอกสารแนบตารางสอน",
  },
  {
    href: "/exam-timer",
    icon: Timer,
    title: "นาฬิกาจับเวลาสอบ",
    description: "ตั้งเวลาเลิกสอบ นับถอยหลังทันที แสดงเต็มจอ มีเสียงเตือน",
  },
];

export function Dashboard() {
  const planned = NAV_ITEMS.filter((item) => item.status === "planned");

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        <TodayCard />

        <div className="grid gap-3 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-[var(--radius-card)] outline-none focus-visible:shadow-[var(--shadow-focus)]"
              >
                <Card className="h-full transition-[box-shadow,border-color] duration-150 group-hover:border-brand-200 group-hover:shadow-[var(--shadow-md)]">
                  <CardContent className="flex h-full flex-col gap-3 py-5">
                    <span className="flex size-10 items-center justify-center rounded-[10px] bg-brand-600 text-white shadow-[var(--shadow-sm)]">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                        {action.title}
                        <ArrowRight className="size-4 -translate-x-1 text-brand-600 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>โมดูลที่กำลังพัฒนา</CardTitle>
              <CardDescription>เปิดใช้งานตามลำดับ Phase</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {planned.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-3 rounded-[var(--radius-control)] border border-border px-3 py-2.5 text-[13px] outline-none transition-colors hover:bg-row-hover focus-visible:shadow-[var(--shadow-focus)]"
                >
                  <Icon className="size-4 shrink-0 text-neutral-500" aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-medium text-neutral-800">{item.label}</span>
                  <Badge>Phase {item.phase}</Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>สถานะระบบ</CardTitle>
              <CardDescription>ตรวจสอบอัตโนมัติทุก 1 นาที</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ServiceStatusList />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>แผนการพัฒนา</CardTitle>
              <CardDescription>
                เสร็จแล้ว {PHASES.filter((p) => p.done).length} จาก {PHASES.length} เฟส
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2">
              {PHASES.map((p) => (
                <li key={p.phase} className="flex items-start gap-2.5 text-[13px]">
                  {p.done ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <CircleDashed className="mt-0.5 size-4 shrink-0 text-neutral-300" aria-hidden />
                  )}
                  <span className={cn(p.done ? "text-neutral-800" : "text-neutral-500")}>
                    <span className="font-[family-name:var(--font-latin)] font-medium">Phase {p.phase}</span> · {p.title}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
