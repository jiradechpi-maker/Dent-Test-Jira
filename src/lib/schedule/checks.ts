import { rangesOverlap, titleTokens } from "@/lib/sheets/text";
import { RESIGNED_INVIGILATORS } from "@/config/master-data";
import type { Bi, Locale } from "@/lib/i18n/locale";
import { shortDay, timeSpan } from "./format";
import type { ExamEntry, InvigilationBook } from "./invigilation";
import type { TeachingSchedule, TeachingSession } from "./teaching";

export type IssueSeverity = "danger" | "warning" | "info";

export type IssueKind =
  | "room-clash"
  | "shared-room"
  | "invigilator-clash"
  | "missing-room"
  | "missing-invigilator"
  | "missing-date"
  | "date-mismatch"
  | "time-mismatch"
  | "not-in-invigilation"
  | "resigned-invigilator";

export interface ScheduleIssue {
  id: string;
  kind: IssueKind;
  severity: IssueSeverity;
  date: string | null;
  title: Bi;
  detail: Bi;
  examIds: string[];
  sessionIds: string[];
  /** What to do about it, e.g. free rooms and the least-loaded free invigilators. */
  suggestion?: Bi;
}

const sameRoom = (a: string, b: string) => a.replace(/\s+/g, "").toLowerCase() === b.replace(/\s+/g, "").toLowerCase();

function timed(entry: ExamEntry): entry is ExamEntry & { date: string; start: string; end: string } {
  return Boolean(entry.date && entry.start && entry.end);
}

/** Build the same sentence once per language (dates and times differ by locale, not only the words). */
const both = (text: (locale: Locale) => string): Bi => ({ th: text("th"), en: text("en") });

const label = (entry: ExamEntry, locale: Locale) =>
  `${entry.title}${entry.year ? (locale === "th" ? ` (ปี ${entry.year})` : ` (Year ${entry.year})`) : ""}`;
const when = (date: string | null, start: string | null, end: string | null, locale: Locale) =>
  `${date ? shortDay(date, locale) : locale === "th" ? "ยังไม่มีวัน" : "no date yet"}${start ? ` ${timeSpan(start, end, locale)}` : ""}`;
/** "Anatomy (ปี 4) 09.00–11.00 กับ Pharmacology (ปี 4) 10.00–12.00" */
const pair = (a: ExamEntry, b: ExamEntry): Bi =>
  both(
    (locale) =>
      `${label(a, locale)} ${timeSpan(a.start, a.end, locale)} ${locale === "th" ? "กับ" : "and"} ${label(b, locale)} ${timeSpan(b.start, b.end, locale)}`,
  );

/** Clashes between exams: two exams in one room at overlapping times, or one invigilator in two places at once. */
export function findExamClashes(entries: ExamEntry[]): ScheduleIssue[] {
  const issues: ScheduleIssue[] = [];
  const list = entries.filter(timed).filter((entry) => !entry.postponed);
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]!;
      const b = list[j]!;
      if (a.date !== b.date || !rangesOverlap(a, b)) continue;
      const rooms = a.rooms.filter((room) => b.rooms.some((other) => sameRoom(room, other)));
      const people = a.invigilators.filter((name) => b.invigilators.includes(name));
      const sameSlot = a.start === b.start && a.end === b.end;
      // Same room, same time, same invigilators: two cohorts sitting one combined session.
      const joint =
        sameSlot && rooms.length > 0 && a.invigilators.length > 0 && people.length === a.invigilators.length && people.length === b.invigilators.length;
      if (rooms.length > 0) {
        issues.push({
          id: `room:${a.id}:${b.id}`,
          kind: joint ? "shared-room" : "room-clash",
          severity: joint ? "info" : "danger",
          date: a.date,
          title: joint
            ? { th: `สอบร่วมห้อง ${rooms.join(", ")}`, en: `Shared exam room: ${rooms.join(", ")}` }
            : { th: `ห้องชน: ${rooms.join(", ")}`, en: `Room clash: ${rooms.join(", ")}` },
          detail: pair(a, b),
          examIds: [a.id, b.id],
          sessionIds: [],
        });
      }
      if (people.length > 0 && !joint) {
        issues.push({
          id: `inv:${a.id}:${b.id}`,
          kind: "invigilator-clash",
          severity: "danger",
          date: a.date,
          title: { th: `กรรมการซ้อนเวลา: ${people.join(", ")}`, en: `Double-booked ${people.length > 1 ? "invigilators" : "invigilator"}: ${people.join(", ")}` },
          detail: pair(a, b),
          examIds: [a.id, b.id],
          sessionIds: [],
        });
      }
    }
  }
  return issues;
}

/** Exams still missing a date, a room or invigilators — only those not yet past. */
export function findIncompleteExams(entries: ExamEntry[], today: string): ScheduleIssue[] {
  const issues: ScheduleIssue[] = [];
  for (const entry of entries) {
    if (entry.date && entry.date < today) continue;
    if (!entry.date || entry.postponed) {
      issues.push({
        id: `date:${entry.id}`,
        kind: "missing-date",
        severity: "warning",
        date: entry.date,
        title: { th: "ยังไม่ได้วันสอบที่แน่นอน", en: "Exam date not yet confirmed" },
        detail: both((locale) => `${label(entry, locale)}${entry.remark ? ` · ${entry.remark}` : ""}`),
        examIds: [entry.id],
        sessionIds: [],
      });
      continue;
    }
    const resigned = entry.invigilators.filter((name) => RESIGNED_INVIGILATORS.includes(name));
    if (resigned.length > 0) {
      issues.push({
        id: `resigned:${entry.id}`,
        kind: "resigned-invigilator",
        severity: "danger",
        date: entry.date,
        title: { th: `มีกรรมการที่ลาออกแล้ว: ${resigned.join(", ")}`, en: `Resigned ${resigned.length > 1 ? "invigilators" : "invigilator"} still assigned: ${resigned.join(", ")}` },
        detail: both((locale) => `${label(entry, locale)} · ${timeSpan(entry.start, entry.end, locale)}`),
        examIds: [entry.id],
        sessionIds: [],
      });
    }
    const noRoom = entry.rooms.length === 0;
    const noInvigilators = entry.invigilators.length === 0;
    const missing = [noRoom ? "ห้องสอบ" : null, noInvigilators ? "กรรมการคุมสอบ" : null].filter(Boolean);
    if (missing.length > 0) {
      const missingEn = noRoom && noInvigilators ? "Exam room and invigilators" : noRoom ? "Exam room" : "Invigilators";
      issues.push({
        id: `incomplete:${entry.id}`,
        kind: noRoom ? "missing-room" : "missing-invigilator",
        severity: "warning",
        date: entry.date,
        title: { th: `ยังไม่ได้จัด${missing.join("และ")}`, en: `${missingEn} not yet assigned` },
        detail: both((locale) => `${label(entry, locale)} · ${timeSpan(entry.start, entry.end, locale)}`),
        examIds: [entry.id],
        sessionIds: [],
      });
    }
  }
  return issues;
}

function similarity(a: string, b: string): number {
  const x = titleTokens(a);
  const y = titleTokens(b);
  if (x.size === 0 || y.size === 0) return 0;
  let shared = 0;
  for (const token of x) if (y.has(token)) shared++;
  return shared / Math.min(x.size, y.size);
}

const sessionText = (session: TeachingSession) => `${session.title} ${session.course ?? ""}`;
const examLike = (session: TeachingSession) => session.kind === "exam" && !/\bNL\b|pretest/i.test(session.title);

/**
 * Compare one cohort's exams in the invigilation workbook with the same cohort's teaching schedule:
 * an exam whose date moved in the teaching schedule, a different time on the same day, and teaching-schedule
 * exams with no invigilation row yet (within months the invigilation workbook already covers).
 */
export function crossCheckYear(book: InvigilationBook, teaching: TeachingSchedule, year: number): ScheduleIssue[] {
  const issues: ScheduleIssue[] = [];
  const exams = book.entries.filter((entry) => entry.year === year);
  const sessions = teaching.sessions.filter(examLike);
  const matched = new Set<string>();

  const score = (entry: ExamEntry, session: TeachingSession) => similarity(entry.title, sessionText(session));
  const unresolved: ExamEntry[] = [];

  // Pass 1: exams that the teaching schedule has on the same day.
  for (const entry of exams) {
    const sameDay = entry.date ? sessions.filter((session) => session.date === entry.date) : [];
    const best = sameDay.map((session) => ({ session, score: score(entry, session) })).sort((a, b) => b.score - a.score)[0];
    if (!best || (best.score === 0 && sameDay.length > 1)) {
      unresolved.push(entry);
      continue;
    }
    matched.add(best.session.id);
    const session = best.session;
    if (entry.start && entry.end && !rangesOverlap({ start: entry.start, end: entry.end }, session)) {
      issues.push({
        id: `time:${entry.id}`,
        kind: "time-mismatch",
        severity: "warning",
        date: entry.date,
        title: { th: "เวลาสอบไม่ตรงกับตารางสอน", en: "Exam time differs from the timetable" },
        detail: {
          th: `${entry.title}: ตารางคุมสอบ ${entry.start}–${entry.end} · ตารางสอน ${session.start}–${session.end}`,
          en: `${entry.title}: invigilation schedule ${entry.start}–${entry.end} · timetable ${session.start}–${session.end}`,
        },
        examIds: [entry.id],
        sessionIds: [session.id],
      });
    }
  }

  // Pass 2: the rest — the teaching schedule probably moved them to another day.
  for (const entry of unresolved) {
    const moved = sessions
      .map((session) => ({ session, score: score(entry, session) }))
      .filter((candidate) => candidate.score >= 0.5 && samePhase(entry.title, candidate.session.title))
      .filter((candidate) => !entry.date || Math.abs(daysBetween(entry.date, candidate.session.date)) <= 75)
      .sort(
        (a, b) =>
          Number(matched.has(a.session.id)) - Number(matched.has(b.session.id)) ||
          b.score - a.score ||
          distance(entry.date, a.session.date) - distance(entry.date, b.session.date),
      )[0];
    if (!moved) continue;
    const session = moved.session;
    const where = (locale: Locale) => {
      const slot = when(session.date, session.start, session.end, locale);
      if (locale === "th") return `ตารางสอน ${slot}${session.movedFrom ? ` (ย้ายมาจาก ${shortDay(session.movedFrom, "th")})` : ""}`;
      return `timetable ${slot}${session.movedFrom ? ` (moved from ${shortDay(session.movedFrom, "en")})` : ""}`;
    };
    if (matched.has(session.id)) {
      issues.push({
        id: `stale:${entry.id}`,
        kind: "date-mismatch",
        severity: "warning",
        date: entry.date,
        title: { th: "แถววันสอบเดิมยังค้างในตารางคุมสอบ", en: "Old exam-date row still in the invigilation schedule" },
        detail: {
          th: `${entry.title}: แถววันที่ ${when(entry.date, entry.start, entry.end, "th")} · ${where("th")} ซึ่งมีแถวของวันใหม่แล้ว — ควรลบแถวเดิม`,
          en: `${entry.title}: row ${entry.date ? "dated" : "with"} ${when(entry.date, entry.start, entry.end, "en")} · ${where("en")} — the new date already has its own row, so delete the old one`,
        },
        examIds: [entry.id],
        sessionIds: [session.id],
      });
      continue;
    }
    matched.add(session.id);
    issues.push({
      id: `moved:${entry.id}`,
      kind: "date-mismatch",
      severity: "danger",
      date: entry.date,
      title: { th: "วันสอบไม่ตรงกับตารางสอน", en: "Exam date differs from the timetable" },
      detail: {
        th: `${entry.title}: ตารางคุมสอบ ${when(entry.date, entry.start, entry.end, "th")} · ${where("th")}`,
        en: `${entry.title}: invigilation schedule ${when(entry.date, entry.start, entry.end, "en")} · ${where("en")}`,
      },
      examIds: [entry.id],
      sessionIds: [session.id],
    });
  }

  const covered = new Set(book.months.map((tab) => tab.month));
  for (const session of sessions) {
    if (matched.has(session.id) || !covered.has(session.date.slice(0, 7))) continue;
    const exists = exams.some((entry) => entry.date === session.date);
    if (exists) continue;
    issues.push({
      id: `missing:${session.id}`,
      kind: "not-in-invigilation",
      // Practical lab exams are usually supervised by the lab's own instructors.
      severity: /\blab\b|laboratory/i.test(session.title) ? "info" : "warning",
      date: session.date,
      title: { th: "มีสอบในตารางสอน แต่ยังไม่มีในตารางคุมสอบ", en: "Exam in the timetable but not in the invigilation schedule" },
      detail: both((locale) => `${session.title} · ${timeSpan(session.start, session.end, locale)}${session.course ? ` · ${session.course}` : ""}`),
      examIds: [],
      sessionIds: [session.id],
    });
  }
  return issues;
}

function examPhase(title: string): "midterm" | "final" | null {
  if (/mid[\s-]?term/i.test(title)) return "midterm";
  if (/\bfi(nal|anl)\b/i.test(title)) return "final";
  return null;
}

/** A midterm row must not be matched to the final (and vice versa); unlabeled titles match either. */
function samePhase(a: string, b: string): boolean {
  const x = examPhase(a);
  const y = examPhase(b);
  return !x || !y || x === y;
}

function daysBetween(a: string, b: string): number {
  return (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000;
}

function distance(a: string | null, b: string): number {
  return a ? Math.abs(daysBetween(a, b)) : 0;
}

const SEVERITY_ORDER: Record<IssueSeverity, number> = { danger: 0, warning: 1, info: 2 };

export function sortIssues(issues: ScheduleIssue[]): ScheduleIssue[] {
  return [...issues].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || (a.date ?? "9999").localeCompare(b.date ?? "9999"),
  );
}
