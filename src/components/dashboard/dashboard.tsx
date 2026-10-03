"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, CircleDashed, CheckCircle2, ClipboardList, Mail, Timer } from "lucide-react";
import { NAV_ITEMS } from "@/config/navigation";
import { DAY_COLORS } from "@/config/master-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceStatusList } from "@/components/system/service-status";
import { TodayTasks } from "./today-tasks";
import { todayInBangkok } from "@/lib/thai";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";
import { formatDay } from "@/lib/i18n/dates";
import { bi, type Bi } from "@/lib/i18n/locale";

const PHASES: { phase: number; title: Bi; done: boolean }[] = [
  { phase: 0, title: bi("โครงระบบ + Design system + ⌘K", "App shell + design system + ⌘K"), done: true },
  { phase: 1, title: bi("ฐานข้อมูล + ตารางสอนหลัก + Excel", "Database + master timetable + Excel"), done: false },
  {
    phase: 2,
    title: bi(
      "Document engine + หนังสือเชิญ (พร้อมใช้ · คลังแม่แบบบน Supabase ตามมากับฐานข้อมูล)",
      "Document engine + invitation letters (ready · Supabase template library to follow with the database)",
    ),
    done: true,
  },
  {
    phase: 3,
    title: bi(
      "ตารางสอบ + เสนอห้อง/กรรมการ + ชั่วโมงคุมสอบ (พร้อมใช้ · จัดอัตโนมัติเต็มรูปแบบตามมา)",
      "Exam schedule + room/invigilator suggestions + invigilation hours (ready · full auto-scheduling to follow)",
    ),
    done: true,
  },
  { phase: 4, title: bi("คลังข้อสอบ Kanban + T-7 + ใบปะหน้า", "Exam paper Kanban + T-7 + cover sheets"), done: false },
  { phase: 5, title: bi("Reconciliation + ใบลงเวลา + ฉบับแก้ไข", "Reconciliation + time sheets + revisions"), done: false },
  { phase: 6, title: bi("หาวันว่าง + Cascade shift", "Slot finder + cascade shift"), done: false },
  { phase: 7, title: bi("ซิงก์ Google Drive (ตารางสอนปี 4 + ตารางคุมสอบ)", "Google Drive sync (Year 4 timetable + invigilation schedule)"), done: true },
  { phase: 8, title: bi("รายงาน + เอกสารคู่มือ", "Reports + user guide"), done: false },
];

function TodayCard() {
  const t = useT();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  if (!now) return <Skeleton className="h-[120px] w-full rounded-[var(--radius-card)]" />;
  const today = todayInBangkok(now);
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const day = DAY_COLORS[weekday] ?? DAY_COLORS[0]!;
  const dateText = formatDay(today, t.locale, "long");
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Bangkok" }).format(now));
  const greeting =
    hour < 12 ? t("สวัสดีตอนเช้า", "Good morning") : hour < 17 ? t("สวัสดีตอนบ่าย", "Good afternoon") : t("สวัสดีตอนเย็น", "Good evening");
  return (
    <Card className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: day.hex }} />
      <CardContent className="flex flex-col gap-1 py-5 pl-6">
        <p className="text-xs font-medium text-muted-foreground">{greeting} 👋</p>
        <p className="text-xl font-semibold tracking-tight text-neutral-900">{dateText}</p>
        <p className="mt-1 flex items-center gap-2 text-xs text-neutral-600">
          <span className="inline-block size-3 rounded-full ring-1 ring-black/10" style={{ background: day.hex }} aria-hidden />
          {t(`สีประจำวัน${day.name.th}`, `Colour of the day · ${day.name.en}`)}
        </p>
      </CardContent>
    </Card>
  );
}

const QUICK_ACTIONS = [
  {
    href: "/schedule",
    icon: CalendarDays,
    title: bi("ตารางสอนชั้นปี 4", "Year 4 timetable"),
    description: bi("ซิงก์จาก Google Drive · ดูรายสัปดาห์ ค้นหาอาจารย์", "Synced from Google Drive · weekly view and lecturer search"),
  },
  {
    href: "/exams",
    icon: ClipboardList,
    title: bi("ตารางสอบ & สิ่งที่ต้องตรวจ", "Exam schedule & checks"),
    description: bi("ห้องชน กรรมการซ้อน พร้อมห้อง/กรรมการที่เสนอให้", "Room clashes and double-booked invigilators, with suggested rooms and invigilators"),
  },
  {
    href: "/documents/invitations",
    icon: Mail,
    title: bi("ออกหนังสือเชิญอาจารย์พิเศษ", "Issue a guest lecturer invitation"),
    description: bi("Word + PDF ตามแบบฟอร์มคณะ พร้อมเอกสารแนบตารางสอน", "Word + PDF on the faculty template, with the timetable attached"),
  },
  {
    href: "/exam-timer",
    icon: Timer,
    title: bi("นาฬิกาจับเวลาสอบ", "Exam timer"),
    description: bi("ใส่เวลาสอบจริง แสดงเต็มจอ พร้อมประกาศเสียงเมื่อเหลือ 5 นาที", "Full-screen exam countdown with a spoken 5-minute warning"),
  },
];

export function Dashboard() {
  const t = useT();
  const planned = NAV_ITEMS.filter((item) => item.status === "planned");
  const phasesDone = PHASES.filter((p) => p.done).length;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        <TodayCard />
        <TodayTasks />

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
                        {t(action.title)}
                        <ArrowRight className="size-4 -translate-x-1 text-brand-600 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t(action.description)}</p>
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
              <CardTitle>{t("โมดูลที่กำลังพัฒนา", "Modules in development")}</CardTitle>
              <CardDescription>{t("เปิดใช้งานตามลำดับ Phase", "Released phase by phase")}</CardDescription>
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
                  <span className="min-w-0 flex-1 truncate font-medium text-neutral-800">{t(item.label)}</span>
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
              <CardTitle>{t("สถานะระบบ", "System status")}</CardTitle>
              <CardDescription>{t("ตรวจสอบอัตโนมัติทุก 1 นาที", "Checked automatically every minute")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ServiceStatusList />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("แผนการพัฒนา", "Roadmap")}</CardTitle>
              <CardDescription>
                {t(`เสร็จแล้ว ${phasesDone} จาก ${PHASES.length} เฟส`, `${phasesDone} of ${PHASES.length} phases complete`)}
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
                    <span className="font-[family-name:var(--font-latin)] font-medium">Phase {p.phase}</span> · {t(p.title)}
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
