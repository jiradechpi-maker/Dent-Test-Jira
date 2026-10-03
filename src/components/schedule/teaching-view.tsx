"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, MoveRight, Search, StickyNote, Users, X } from "lucide-react";
import { useT } from "@/components/i18n/locale-provider";
import type { TeachingSchedule, TeachingSession } from "@/lib/schedule/teaching";
import { addDays, mediumDay, mondayOf, shortDay, timeSpan } from "@/lib/schedule/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { KIND_LABEL, WeekGrid } from "./week-grid";

type View = "week" | "agenda" | "notes";

function matches(session: TeachingSession, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    session.title.toLowerCase().includes(q) ||
    (session.course ?? "").toLowerCase().includes(q) ||
    session.instructors.some((name) => name.toLowerCase().includes(q))
  );
}

export function TeachingView({ schedule, today }: { schedule: TeachingSchedule; today: string }) {
  const t = useT();
  const [view, setView] = useState<View>("week");
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("");
  const [selected, setSelected] = useState<TeachingSession | null>(null);

  const weeks = useMemo(() => [...new Set(schedule.sessions.map((session) => mondayOf(session.date)))].sort(), [schedule.sessions]);
  const initialWeek = useMemo(() => {
    const current = mondayOf(today);
    return weeks.find((week) => week >= current) ?? weeks.at(-1) ?? current;
  }, [weeks, today]);
  const [monday, setMonday] = useState(initialWeek);
  useEffect(() => setMonday(initialWeek), [initialWeek]);

  const filtered = useMemo(
    () => schedule.sessions.filter((session) => (!course || session.course === course) && matches(session, query)),
    [schedule.sessions, course, query],
  );
  const weekSessions = filtered.filter((session) => session.date >= monday && session.date <= addDays(monday, 6));
  const weekIndex = weeks.indexOf(monday);
  const weekNumber = schedule.sessions.find((session) => mondayOf(session.date) === monday)?.week ?? null;
  const courseNames = useMemo(() => [...new Set(schedule.courses.map((c) => c.name))], [schedule.courses]);
  const colorOf = (name: string) => schedule.courses.find((c) => c.name === name)?.color;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<View>
          ariaLabel={t("มุมมอง", "View")}
          value={view}
          onChange={setView}
          options={[
            { value: "week", label: t("รายสัปดาห์", "Week") },
            { value: "agenda", label: t("รายการ", "List") },
            { value: "notes", label: t(`ข้อความนอกตาราง (${schedule.notes.length})`, `Off-grid notes (${schedule.notes.length})`) },
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" aria-hidden />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("ค้นหาหัวข้อ / ชื่ออาจารย์", "Search topic or lecturer")}
              aria-label={t("ค้นหาคาบเรียน", "Search sessions")}
              className="pl-8"
            />
          </div>
          <div className="sm:w-72">
            <NativeSelect value={course} onChange={(event) => setCourse(event.target.value)} aria-label={t("กรองตามรายวิชา", "Filter by course")}>
              <option value="">{t("ทุกรายวิชา", "All courses")}</option>
              {courseNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </div>

      {view === "week" ? (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" aria-label={t("สัปดาห์ก่อน", "Previous week")} disabled={weekIndex <= 0} onClick={() => setMonday(weeks[weekIndex - 1]!)}>
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("สัปดาห์ถัดไป", "Next week")}
                disabled={weekIndex < 0 || weekIndex >= weeks.length - 1}
                onClick={() => setMonday(weeks[weekIndex + 1]!)}
              >
                <ChevronRight aria-hidden />
              </Button>
              <span className="ml-1 text-sm font-medium text-neutral-900">
                {weekNumber ? `Week ${weekNumber} · ` : ""}
                {shortDay(monday, t.locale)} – {shortDay(addDays(monday, 4), t.locale)}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setMonday(mondayOf(today))}>
              <CalendarClock aria-hidden /> {t("สัปดาห์นี้", "This week")}
            </Button>
          </div>
          {weekSessions.length === 0 && !schedule.notes.some((note) => note.date && note.date >= monday && note.date <= addDays(monday, 6)) ? (
            <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">
              {query || course
                ? t("ไม่มีคาบเรียนในสัปดาห์นี้ ที่ตรงกับตัวกรอง", "No sessions this week match the filters")
                : t("ไม่มีคาบเรียนในสัปดาห์นี้", "No sessions this week")}
            </p>
          ) : (
            <WeekGrid
              monday={monday}
              sessions={weekSessions}
              notes={schedule.notes}
              today={today}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              onShowNotes={() => setView("notes")}
            />
          )}
          {selected ? <SessionDetail session={selected} onClose={() => setSelected(null)} /> : null}
        </Card>
      ) : null}

      {view === "agenda" ? <Agenda sessions={filtered} today={today} /> : null}

      {view === "notes" ? (
        <Card className="p-4">
          <p className="mb-3 flex items-start gap-2 text-[13px] text-muted-foreground">
            <StickyNote className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            {t(
              "ข้อความที่อยู่นอกช่องเวลาของสัปดาห์ (เช่น คาบที่พักไว้ด้านขวาของชีต หรือ “รอ อ.คอนเฟิร์ม”) ระบบไม่เดาเวลาให้ — แสดงไว้ให้ตรวจเอง",
              "Notes outside the weekly time slots (e.g. sessions parked to the right of the sheet, or “รอ อ.คอนเฟิร์ม” — awaiting the lecturer's confirmation). No time is guessed for them — they are listed here for you to check.",
            )}
          </p>
          <ul className="divide-y divide-border rounded-[var(--radius-control)] border border-border text-[13px]">
            {schedule.notes.map((note) => (
              <li key={note.id} className="flex gap-3 px-3 py-2">
                <span className="w-28 shrink-0 text-xs text-muted-foreground tabular">{note.date ? shortDay(note.date, t.locale) : "—"}</span>
                <span className="w-12 shrink-0 font-mono text-[11px] text-neutral-400">{note.id}</span>
                <span className="min-w-0 text-neutral-800">{note.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {view === "week" && courseNames.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {courseNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCourse((value) => (value === name ? "" : name))}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-neutral-700 hover:bg-neutral-50",
                course === name && "border-brand-400 bg-brand-50",
              )}
            >
              <span className="size-2.5 rounded-full border border-black/10" style={{ backgroundColor: `#${colorOf(name)}` }} aria-hidden />
              {name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SessionDetail({ session, onClose }: { session: TeachingSession; onClose: () => void }) {
  const t = useT();
  return (
    <div className="flex items-start gap-3 border-t border-border bg-neutral-50 px-4 py-3 text-[13px]">
      <span
        className="mt-1 size-3 shrink-0 rounded-full border border-black/10"
        style={{ backgroundColor: session.color ? `#${session.color}` : undefined }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-neutral-900">{session.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="tabular">
            {mediumDay(session.date, t.locale)} · {timeSpan(session.start, session.end, t.locale)}
          </span>
          <Badge>{t(KIND_LABEL[session.kind])}</Badge>
          {session.course ? <span>{session.course}</span> : null}
          {session.instructors.length ? (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" aria-hidden /> {session.instructors.join(", ")}
            </span>
          ) : null}
          {session.movedFrom ? (
            <Badge tone="warning">
              <MoveRight aria-hidden /> {t(`ย้ายมาจาก ${shortDay(session.movedFrom, "th")}`, `Moved from ${shortDay(session.movedFrom, "en")}`)}
            </Badge>
          ) : null}
          <span className="font-mono text-[11px] text-neutral-400">{t(`ช่อง ${session.id}`, `Cell ${session.id}`)}</span>
        </p>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label={t("ปิด", "Close")} onClick={onClose}>
        <X aria-hidden />
      </Button>
    </div>
  );
}

function Agenda({ sessions, today }: { sessions: TeachingSession[]; today: string }) {
  const t = useT();
  const [showPast, setShowPast] = useState(false);
  const visible = showPast ? sessions : sessions.filter((session) => session.date >= today);
  const days = useMemo(() => {
    const map = new Map<string, TeachingSession[]>();
    for (const session of visible) map.set(session.date, [...(map.get(session.date) ?? []), session]);
    return [...map.entries()];
  }, [visible]);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span>{t(`${visible.length} คาบ`, `${visible.length} ${visible.length === 1 ? "session" : "sessions"}`)}</span>
        <Button variant="link" size="sm" onClick={() => setShowPast((value) => !value)}>
          {showPast ? t("ซ่อนคาบที่ผ่านมาแล้ว", "Hide past sessions") : t("แสดงคาบที่ผ่านมาแล้วด้วย", "Show past sessions too")}
        </Button>
      </div>
      {days.length === 0 ? <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">{t("ไม่พบคาบเรียน", "No sessions found")}</p> : null}
      <ol className="divide-y divide-border">
        {days.map(([date, items]) => (
          <li key={date} className={cn("grid gap-2 px-4 py-3 sm:grid-cols-[150px_1fr]", date === today && "bg-brand-50/50")}>
            <span className={cn("text-[13px] font-medium text-neutral-800", date === today && "text-brand-700")}>
              {mediumDay(date, t.locale)}
              {date === today ? t(" · วันนี้", " · Today") : ""}
            </span>
            <ul className="flex flex-col gap-1.5">
              {items.map((session) => (
                <li key={session.id} className="flex items-start gap-2 text-[13px]">
                  <span
                    className="mt-1 size-2.5 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: session.color ? `#${session.color}` : "var(--color-neutral-200)" }}
                    aria-hidden
                  />
                  <span className="w-24 shrink-0 text-xs text-muted-foreground tabular">{timeSpan(session.start, session.end, t.locale)}</span>
                  <span className="min-w-0 flex-1 text-neutral-800">
                    {session.title}
                    {session.kind === "exam" ? (
                      <Badge tone="danger" className="ml-1.5">
                        {t(KIND_LABEL.exam)}
                      </Badge>
                    ) : null}
                    {session.movedFrom ? (
                      <Badge tone="warning" className="ml-1.5">
                        {t(`ย้ายมาจาก ${shortDay(session.movedFrom, "th")}`, `Moved from ${shortDay(session.movedFrom, "en")}`)}
                      </Badge>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Card>
  );
}
