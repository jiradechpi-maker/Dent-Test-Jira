import { addDays, shortDay, timeSpan } from "./format";
import type { ExamEntry, InvigilationBook } from "./invigilation";
import type { TeachingSchedule, TeachingSession } from "./teaching";

export type AgendaTone = "danger" | "warning" | "info" | "neutral";

export interface AgendaItem {
  id: string;
  tone: AgendaTone;
  title: string;
  detail: string;
  href: string;
}

/** Friday → Monday, Saturday → Monday, otherwise tomorrow. */
export function nextWorkingDay(today: string): string {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  return addDays(today, weekday === 5 ? 3 : weekday === 6 ? 2 : 1);
}

const where = (entry: ExamEntry) => (entry.rooms.length ? entry.rooms.join(" + ") : "ยังไม่มีห้อง");
const who = (entry: ExamEntry) => (entry.invigilators.length ? entry.invigilators.join(", ") : "ยังไม่มีกรรมการ");
const live = (entry: ExamEntry) => !entry.postponed && entry.date !== null;

/** Things to do today, derived from the synced sheets (no manual entry needed). */
export function todayAgenda(book: InvigilationBook | null, teaching: TeachingSchedule | null, today: string): AgendaItem[] {
  const items: AgendaItem[] = [];
  if (book) {
    for (const entry of book.entries.filter((e) => live(e) && e.date === today)) {
      items.push({
        id: `today:${entry.id}`,
        tone: entry.rooms.length && entry.invigilators.length ? "info" : "danger",
        title: `สอบวันนี้ ${timeSpan(entry.start, entry.end)} · ${entry.title}${entry.year ? ` (ปี ${entry.year})` : ""}`,
        detail: `ห้อง ${where(entry)} · กรรมการ ${who(entry)}`,
        href: "/exams",
      });
    }

    const next = nextWorkingDay(today);
    const upcoming = book.entries.filter((e) => live(e) && e.date === next);
    if (upcoming.length) {
      items.push({
        id: `next:${next}`,
        tone: upcoming.some((e) => !e.rooms.length || !e.invigilators.length) ? "warning" : "neutral",
        title: `เตรียมสอบ ${shortDay(next)} (${upcoming.length} วิชา) — แจ้งกรรมการและเตรียมซองข้อสอบ`,
        detail: upcoming.map((e) => `${timeSpan(e.start, e.end)} ${e.title} · ${where(e)} · ${who(e)}`).join("\n"),
        href: "/exams",
      });
    }

    const horizon = addDays(today, 3);
    for (const entry of book.entries) {
      if (!entry.submitBy || entry.paperReceived || (entry.date && entry.date < today) || entry.submitBy > horizon) continue;
      const overdue = entry.submitBy < today;
      items.push({
        id: `paper:${entry.id}`,
        tone: overdue ? "danger" : entry.submitBy === today ? "warning" : "neutral",
        title: `${overdue ? "เลยกำหนดส่งข้อสอบ" : entry.submitBy === today ? "ครบกำหนดส่งข้อสอบวันนี้" : `ตามข้อสอบ (ส่งภายใน ${shortDay(entry.submitBy)})`} · ${entry.title}`,
        detail: `${entry.year ? `ปี ${entry.year} · ` : ""}สอบ ${entry.date ? shortDay(entry.date) : "ยังไม่มีวัน"} ${timeSpan(entry.start, entry.end)}`,
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
        title: `คาบเรียนปี 4 วันนี้ ${sessions.length} คาบ`,
        detail: sessions.map((s) => `${timeSpan(s.start, s.end)} ${s.title}`).join("\n"),
        href: "/schedule",
      });
    }
  }

  const order: Record<AgendaTone, number> = { danger: 0, warning: 1, info: 2, neutral: 3 };
  return items.sort((a, b) => order[a.tone] - order[b.tone]);
}
