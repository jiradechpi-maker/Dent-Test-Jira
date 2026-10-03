import type { Bi } from "@/lib/i18n/locale";
import { addDays, shortDay, timeSpan } from "./format";
import type { ExamEntry, InvigilationBook } from "./invigilation";
import type { TeachingSchedule, TeachingSession } from "./teaching";

export type AgendaTone = "danger" | "warning" | "info" | "neutral";

export interface AgendaItem {
  id: string;
  tone: AgendaTone;
  title: Bi;
  detail: Bi;
  href: string;
}

/** Friday → Monday, Saturday → Monday, otherwise tomorrow. */
export function nextWorkingDay(today: string): string {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  return addDays(today, weekday === 5 ? 3 : weekday === 6 ? 2 : 1);
}

const rooms = (entry: ExamEntry) => entry.rooms.join(" + ");
const names = (entry: ExamEntry) => entry.invigilators.join(", ");
/** Rooms as listed in the sheet, or a self-explanatory "none yet". */
const where = (entry: ExamEntry): Bi =>
  entry.rooms.length ? { th: rooms(entry), en: rooms(entry) } : { th: "ยังไม่มีห้อง", en: "no room yet" };
const who = (entry: ExamEntry): Bi =>
  entry.invigilators.length ? { th: names(entry), en: names(entry) } : { th: "ยังไม่มีกรรมการ", en: "no invigilators yet" };
const live = (entry: ExamEntry) => !entry.postponed && entry.date !== null;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
/** English time range; a missing start reads "(time TBC)" instead of a capitalised "No time set" mid-sentence. */
const enSpan = (start: string | null, end: string | null) => (start ? timeSpan(start, end, "en") : "(time TBC)");

/** Things to do today, derived from the synced sheets (no manual entry needed). */
export function todayAgenda(book: InvigilationBook | null, teaching: TeachingSchedule | null, today: string): AgendaItem[] {
  const items: AgendaItem[] = [];
  if (book) {
    for (const entry of book.entries.filter((e) => live(e) && e.date === today)) {
      items.push({
        id: `today:${entry.id}`,
        tone: entry.rooms.length && entry.invigilators.length ? "info" : "danger",
        title: {
          th: `สอบวันนี้ ${timeSpan(entry.start, entry.end, "th")} · ${entry.title}${entry.year ? ` (ปี ${entry.year})` : ""}`,
          en: `Exam today ${enSpan(entry.start, entry.end)} · ${entry.title}${entry.year ? ` (Year ${entry.year})` : ""}`,
        },
        detail: {
          th: `ห้อง ${where(entry).th} · กรรมการ ${who(entry).th}`,
          en: `${entry.rooms.length > 1 ? "Rooms" : "Room"}: ${entry.rooms.length ? rooms(entry) : "not assigned"} · ${
            entry.invigilators.length === 1 ? "Invigilator" : "Invigilators"
          }: ${entry.invigilators.length ? names(entry) : "not assigned"}`,
        },
        href: "/exams",
      });
    }

    const next = nextWorkingDay(today);
    const upcoming = book.entries.filter((e) => live(e) && e.date === next);
    if (upcoming.length) {
      items.push({
        id: `next:${next}`,
        tone: upcoming.some((e) => !e.rooms.length || !e.invigilators.length) ? "warning" : "neutral",
        title: {
          th: `เตรียมสอบ ${shortDay(next, "th")} (${upcoming.length} วิชา) — แจ้งกรรมการและเตรียมซองข้อสอบ`,
          en: `Exam prep for ${shortDay(next, "en")} (${plural(upcoming.length, "course", "courses")}) — notify invigilators and prepare exam envelopes`,
        },
        detail: {
          th: upcoming.map((e) => `${timeSpan(e.start, e.end, "th")} ${e.title} · ${where(e).th} · ${who(e).th}`).join("\n"),
          en: upcoming.map((e) => `${enSpan(e.start, e.end)} ${e.title} · ${where(e).en} · ${who(e).en}`).join("\n"),
        },
        href: "/exams",
      });
    }

    const horizon = addDays(today, 3);
    for (const entry of book.entries) {
      if (!entry.submitBy || entry.paperReceived || (entry.date && entry.date < today) || entry.submitBy > horizon) continue;
      const overdue = entry.submitBy < today;
      const dueToday = entry.submitBy === today;
      items.push({
        id: `paper:${entry.id}`,
        tone: overdue ? "danger" : dueToday ? "warning" : "neutral",
        title: {
          th: `${overdue ? "เลยกำหนดส่งข้อสอบ" : dueToday ? "ครบกำหนดส่งข้อสอบวันนี้" : `ตามข้อสอบ (ส่งภายใน ${shortDay(entry.submitBy, "th")})`} · ${entry.title}`,
          en: `${overdue ? "Exam paper overdue" : dueToday ? "Exam paper due today" : `Chase exam paper (due ${shortDay(entry.submitBy, "en")})`} · ${entry.title}`,
        },
        detail: {
          th: `${entry.year ? `ปี ${entry.year} · ` : ""}สอบ ${entry.date ? shortDay(entry.date, "th") : "ยังไม่มีวัน"} ${timeSpan(entry.start, entry.end, "th")}`,
          en: `${entry.year ? `Year ${entry.year} · ` : ""}Exam ${entry.date ? shortDay(entry.date, "en") : "date TBC"}${
            entry.start ? `, ${timeSpan(entry.start, entry.end, "en")}` : entry.date ? " (time TBC)" : ""
          }`,
        },
        href: "/exams",
      });
    }
  }

  if (teaching) {
    const sessions = teaching.sessions.filter((s: TeachingSession) => s.date === today && s.kind !== "holiday");
    if (sessions.length) {
      items.push({
        id: `teaching:${today}`,
        tone: "neutral",
        title: {
          th: `คาบเรียนปี 4 วันนี้ ${sessions.length} คาบ`,
          en: `Year 4 has ${plural(sessions.length, "class", "classes")} today`,
        },
        detail: {
          th: sessions.map((s) => `${timeSpan(s.start, s.end, "th")} ${s.title}`).join("\n"),
          en: sessions.map((s) => `${timeSpan(s.start, s.end, "en")} ${s.title}`).join("\n"),
        },
        href: "/schedule",
      });
    }
  }

  const order: Record<AgendaTone, number> = { danger: 0, warning: 1, info: 2, neutral: 3 };
  return items.sort((a, b) => order[a.tone] - order[b.tone]);
}
