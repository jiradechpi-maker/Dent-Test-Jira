"use client";

import { useMemo } from "react";
import { MoveRight } from "lucide-react";
import { useT } from "@/components/i18n/locale-provider";
import { formatTime } from "@/lib/i18n/dates";
import type { Bi } from "@/lib/i18n/locale";
import type { OffGridNote, TeachingSession } from "@/lib/schedule/teaching";
import { addDays, shortDay, timeSpan } from "@/lib/schedule/format";
import { minutesOf } from "@/lib/sheets/text";
import { cn } from "@/lib/utils";

const KIND_STYLE: Record<TeachingSession["kind"], string> = {
  lecture: "bg-brand-50",
  lab: "bg-info-bg",
  exam: "bg-danger-bg",
  clinic: "bg-success-bg",
  research: "bg-neutral-100",
  elective: "bg-neutral-100",
  holiday: "bg-neutral-100",
  event: "bg-warning-bg",
};

export const KIND_LABEL: Record<TeachingSession["kind"], Bi> = {
  lecture: { th: "บรรยาย", en: "Lecture" },
  lab: { th: "แล็บ", en: "Lab" },
  exam: { th: "สอบ", en: "Exam" },
  clinic: { th: "คลินิก", en: "Clinic" },
  research: { th: "วิจัย", en: "Research" },
  elective: { th: "วิชาเลือก", en: "Elective" },
  holiday: { th: "วันหยุด", en: "Holiday" },
  event: { th: "กิจกรรม", en: "Event" },
};

/** Greedy lane assignment so overlapping sessions (clinic groups, parallel labs) stack instead of covering each other. */
function layoutDay(sessions: TeachingSession[]): { session: TeachingSession; lane: number }[] {
  const laneEnds: number[] = [];
  return [...sessions]
    .sort((a, b) => minutesOf(a.start) - minutesOf(b.start) || minutesOf(b.end) - minutesOf(a.end))
    .map((session) => {
      const start = minutesOf(session.start);
      let lane = laneEnds.findIndex((end) => end <= start);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = minutesOf(session.end);
      return { session, lane };
    });
}

/** The sheet's own layout — one row per day, time running left to right — for a single week. */
export function WeekGrid({
  monday,
  sessions,
  notes,
  today,
  selectedId,
  onSelect,
  onShowNotes,
}: {
  monday: string;
  sessions: TeachingSession[];
  notes: OffGridNote[];
  onShowNotes: () => void;
  today: string;
  selectedId: string | null;
  onSelect: (session: TeachingSession) => void;
}) {
  const t = useT();
  const days = useMemo(() => {
    const all = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    return all.filter((day, i) => i < 5 || sessions.some((session) => session.date === day));
  }, [monday, sessions]);
  const notesOn = (day: string) => notes.filter((note) => note.date === day);

  const startMin = Math.min(8 * 60, ...sessions.map((s) => minutesOf(s.start)));
  const endMin = Math.max(17 * 60, ...sessions.map((s) => minutesOf(s.end)));
  const span = endMin - startMin;
  const hours = Array.from({ length: Math.ceil(span / 60) }, (_, i) => startMin + i * 60);
  const pos = (minutes: number) => `${((minutes - startMin) / span) * 100}%`;

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="min-w-[780px]">
        <div className="grid grid-cols-[92px_1fr] border-b border-border text-[11px] text-muted-foreground">
          <div />
          <div className="relative h-6">
            {hours.map((minute) => (
              <span key={minute} className="absolute top-1 -translate-x-1/2 tabular" style={{ left: pos(minute) }}>
                {formatTime(`${String(minute / 60).padStart(2, "0")}:00`, t.locale)}
              </span>
            ))}
          </div>
        </div>
        {days.map((day) => {
          const placed = layoutDay(sessions.filter((session) => session.date === day));
          const lanes = Math.max(1, ...placed.map((item) => item.lane + 1));
          const isToday = day === today;
          return (
            <div key={day} className={cn("grid grid-cols-[92px_1fr] border-b border-border", isToday && "bg-brand-50/50")}>
              <div className="flex flex-col justify-center px-2 py-2 text-xs">
                <span className={cn("font-medium text-neutral-800", isToday && "text-brand-700")}>{shortDay(day, t.locale)}</span>
                {isToday ? <span className="text-[10px] font-medium text-brand-600">{t("วันนี้", "Today")}</span> : null}
                {notesOn(day).length > 0 ? (
                  <button
                    type="button"
                    onClick={onShowNotes}
                    title={notesOn(day)
                      .map((note) => note.text)
                      .join("\n")}
                    className="mt-1 w-fit cursor-pointer rounded bg-warning-bg px-1 text-[10px] font-medium text-warning hover:underline"
                  >
                    {t(`นอกตาราง ${notesOn(day).length}`, `${notesOn(day).length} off-grid`)}
                  </button>
                ) : null}
              </div>
              <div className="relative" style={{ height: `${lanes * 64 + 8}px` }}>
                {hours.map((minute) => (
                  <span key={minute} aria-hidden className="absolute inset-y-0 border-l border-dashed border-neutral-200" style={{ left: pos(minute) }} />
                ))}
                {placed.map(({ session, lane }) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onSelect(session)}
                    title={`${timeSpan(session.start, session.end, t.locale)} · ${session.title}`}
                    className={cn(
                      "absolute flex cursor-pointer flex-col overflow-hidden rounded-md border border-black/5 px-1.5 py-1 text-left text-[11px] leading-tight text-neutral-800 shadow-[var(--shadow-sm)] transition-shadow outline-none hover:shadow-[var(--shadow-md)] focus-visible:shadow-[var(--shadow-focus)]",
                      !session.color && KIND_STYLE[session.kind],
                      session.kind === "holiday" && "bg-[repeating-linear-gradient(135deg,var(--color-neutral-100)_0_6px,var(--color-neutral-50)_6px_12px)] text-neutral-500",
                      session.kind === "exam" && "ring-2 ring-danger/60",
                      selectedId === session.id && "ring-2 ring-brand-600",
                    )}
                    style={{
                      left: `calc(${pos(minutesOf(session.start))} + 1px)`,
                      width: `calc(${((minutesOf(session.end) - minutesOf(session.start)) / span) * 100}% - 2px)`,
                      top: `${lane * 64 + 4}px`,
                      height: "60px",
                      backgroundColor: session.color && session.kind !== "holiday" ? `#${session.color}` : undefined,
                    }}
                  >
                    <span className="font-medium tabular text-neutral-600">{timeSpan(session.start, session.end, t.locale)}</span>
                    <span className="line-clamp-2">{session.title}</span>
                    {session.movedFrom ? (
                      <span className="absolute top-1 right-1 rounded bg-warning px-1 text-[9px] font-semibold text-white">
                        <MoveRight className="inline size-2.5" aria-label={t("ย้ายวัน", "Moved")} />
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
