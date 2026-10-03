"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck2, ChevronRight, CircleAlert, Info, ListTodo, Plus, Trash2, TriangleAlert } from "lucide-react";
import { todayAgenda, type AgendaTone } from "@/lib/schedule/agenda";
import { addDays, shortDay } from "@/lib/schedule/format";
import { todayInBangkok } from "@/lib/thai";
import { cn } from "@/lib/utils";
import { useScheduleBundle } from "@/components/schedule/use-schedule";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/i18n/locale-provider";
import { bi } from "@/lib/i18n/locale";

interface Task {
  id: string;
  text: string;
  date: string;
  done: boolean;
}

const STORAGE_KEY = "dentops.tasks.v1";
const PRESETS = [
  bi("ตามลายเซ็น", "Chase signature"),
  bi("ตามข้อสอบ", "Chase exam paper"),
  bi("ส่งเอกสาร", "Send documents"),
  bi("จองห้อง", "Book a room"),
  bi("แจ้งกรรมการคุมสอบ", "Notify invigilators"),
];

function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTasks(JSON.parse(raw) as Task[]);
    } catch {
      // unreadable storage — start empty
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // storage blocked — tasks last for this visit only
    }
  }, [tasks, loaded]);
  return [tasks, setTasks] as const;
}

const TONE_ICON = { danger: TriangleAlert, warning: CircleAlert, info: Info, neutral: CalendarCheck2 } as const;
const TONE_CLASS: Record<AgendaTone, string> = {
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
  neutral: "text-neutral-400",
};

/** "งานวันนี้": items worked out from the synced sheets plus the user's own to-dos (stored in this browser). */
export function TodayTasks() {
  const t = useT();
  const { teaching, invigilation } = useScheduleBundle();
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayInBangkok()), []);
  const [tasks, setTasks] = useTasks();
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    if (today) setDate(today);
  }, [today]);

  const auto = useMemo(
    () => (today ? todayAgenda(invigilation?.ok ? invigilation.data : null, teaching?.ok ? teaching.data : null, today) : []),
    [today, invigilation, teaching],
  );

  if (!today) return null;
  const due = tasks.filter((task) => !task.done && task.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  const doneToday = tasks.filter((task) => task.done && task.date === today);
  const later = tasks.filter((task) => !task.done && task.date > today && task.date <= addDays(today, 7)).sort((a, b) => a.date.localeCompare(b.date));
  const noSync = !teaching?.ok && !invigilation?.ok;

  const add = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setTasks((current) => [...current, { id: crypto.randomUUID(), text: trimmed, date: date || today, done: false }]);
    setText("");
  };
  const toggle = (id: string) => setTasks((current) => current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  const remove = (id: string) => setTasks((current) => current.filter((task) => task.id !== id));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="size-4 text-brand-600" aria-hidden /> {t("งานวันนี้", "Today's tasks")}
          </CardTitle>
          <CardDescription>
            {t(
              "ระบบดึงจากตารางสอบ/ตารางสอนให้เอง + รายการที่จดไว้ (จดไว้ในเบราว์เซอร์เครื่องนี้)",
              "Pulled automatically from the exam schedule and timetable, plus your own to-dos (saved in this browser)",
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {auto.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {auto.map((item) => {
              const Icon = TONE_ICON[item.tone];
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    title={t(item.detail)}
                    className="group flex items-start gap-2.5 rounded-[var(--radius-control)] border border-border px-3 py-2 text-[13px] outline-none hover:bg-row-hover focus-visible:shadow-[var(--shadow-focus)]"
                  >
                    <Icon className={cn("mt-0.5 size-4 shrink-0", TONE_CLASS[item.tone])} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-neutral-900">{t(item.title)}</span>
                      <span className="mt-0.5 block text-xs whitespace-pre-line text-muted-foreground">{t(item.detail)}</span>
                    </span>
                    <ChevronRight className="mt-0.5 size-4 shrink-0 text-neutral-300 group-hover:text-brand-600" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[13px] text-muted-foreground">
            {noSync
              ? t("ยังไม่ได้เชื่อมตาราง — ดูที่เมนูตารางสอนชั้นปี 4", "No schedules connected yet — see Year 4 timetable in the menu")
              : t("วันนี้ไม่มีสอบหรือข้อสอบที่ต้องตาม", "No exams today and no exam papers to chase")}
          </p>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-neutral-600">{t("รายการที่ต้องทำ", "To-do list")}</p>
          {due.length === 0 && doneToday.length === 0 ? <p className="text-[13px] text-muted-foreground">{t("ยังไม่มีรายการสำหรับวันนี้", "Nothing on the list for today")}</p> : null}
          <ul className="flex flex-col gap-1">
            {[...due, ...doneToday].map((task) => (
              <li key={task.id} className="group flex items-center gap-2.5 rounded-md px-1 py-1 text-[13px] hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggle(task.id)}
                  aria-label={t(`ทำเสร็จแล้ว: ${task.text}`, `Done: ${task.text}`)}
                  className="size-4 cursor-pointer accent-[var(--color-brand-600)]"
                />
                <span className={cn("min-w-0 flex-1", task.done && "text-neutral-400 line-through")}>{task.text}</span>
                {!task.done && task.date < today ? (
                  <span className="text-[11px] font-medium text-danger">
                    {t(`ค้างจาก ${shortDay(task.date, "th")}`, `Carried over from ${shortDay(task.date, "en")}`)}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(task.id)}
                  aria-label={t(`ลบ ${task.text}`, `Delete ${task.text}`)}
                  className="cursor-pointer rounded p-0.5 text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-danger focus-visible:opacity-100"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          {later.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("อีก 7 วันข้างหน้า:", "Next 7 days:")} {later.map((task) => `${shortDay(task.date, t.locale)} ${task.text}`).join(" · ")}
            </p>
          ) : null}

          <form
            className="mt-1 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              add(text);
            }}
          >
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t("เช่น ตามลายเซ็น อ.… ใบลงเวลาสอน", "e.g. Chase signature from Dr … on teaching time sheet")}
              aria-label={t("สิ่งที่ต้องทำ", "To-do")}
            />
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label={t("วันที่", "Date")} className="sm:w-40" />
            <Button type="submit" disabled={!text.trim()}>
              <Plus aria-hidden /> {t("เพิ่ม", "Add")}
            </Button>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.en}
                type="button"
                onClick={() => setText((value) => (value ? value : `${t(preset)} `))}
                className="cursor-pointer rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-neutral-600 hover:bg-neutral-50"
              >
                {t(preset)}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
