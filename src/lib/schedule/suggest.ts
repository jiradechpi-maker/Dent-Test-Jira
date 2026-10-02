import { buildingForYear, INVIGILATORS, RESIGNED_INVIGILATORS, ROOM_RULES, type RoomRule } from "@/config/master-data";
import { rangesOverlap } from "@/lib/sheets/text";
import type { ScheduleIssue } from "./checks";
import type { ExamEntry } from "./invigilation";
import type { InvigilatorLoad } from "./load";

const sameRoom = (a: string, b: string) => a.replace(/\s+/g, "").toLowerCase() === b.replace(/\s+/g, "").toLowerCase();

type Timed = ExamEntry & { date: string; start: string; end: string };
const isTimed = (entry: ExamEntry): entry is Timed => Boolean(entry.date && entry.start && entry.end);

/** Other exams running at the same time as `entry` (postponed rows don't hold rooms or people). */
export function concurrentExams(entry: ExamEntry, entries: ExamEntry[]): Timed[] {
  if (!isTimed(entry)) return [];
  return entries.filter(isTimed).filter((other) => other.id !== entry.id && !other.postponed && other.date === entry.date && rangesOverlap(entry, other));
}

/**
 * Free room options for an exam, best first: the cohort's own building first (401 for years 3+,
 * a DT01/DT03/DT05 pair for years 1–2), then the other building. Pairs split the cohort half and half.
 */
export function suggestRooms(entry: ExamEntry, entries: ExamEntry[]): RoomRule[] {
  if (!isTimed(entry)) return [];
  const busy = concurrentExams(entry, entries).flatMap((other) => other.rooms);
  const home = buildingForYear(entry.year);
  const free = ROOM_RULES.filter((rule) => !rule.rooms.some((room) => busy.some((taken) => sameRoom(room, taken))));
  return [...free.filter((rule) => rule.building === home), ...free.filter((rule) => rule.building !== home)];
}

const ACTIVE = INVIGILATORS.map((person) => person.nickname).filter((name) => !RESIGNED_INVIGILATORS.includes(name));
const B55_STAFF = new Set(INVIGILATORS.filter((person) => person.priority).map((person) => person.nickname));

/**
 * Invigilators free at the exam's time, fewest hours first. For building-55 exams the building's own staff
 * come first; elsewhere they go last so they are not sent across campus.
 */
export function suggestInvigilators(entry: ExamEntry, entries: ExamEntry[], loads: InvigilatorLoad[], count: number): string[] {
  if (!isTimed(entry)) return [];
  const busy = new Set(concurrentExams(entry, entries).flatMap((other) => other.invigilators));
  const hours = new Map(loads.map((load) => [load.name, load.total]));
  const inB55 = buildingForYear(entry.year) === "B55";
  return ACTIVE.filter((name) => !busy.has(name) && !entry.invigilators.includes(name))
    .sort((a, b) => {
      const local = Number(B55_STAFF.has(b) === inB55) - Number(B55_STAFF.has(a) === inB55);
      return local || (hours.get(a) ?? 0) - (hours.get(b) ?? 0) || a.localeCompare(b);
    })
    .slice(0, count);
}

const roomLabel = (rule: RoomRule) => rule.rooms.join(" + ");

/**
 * Add a concrete next step to issues about rooms and invigilators. Suggestions are made in date order and
 * each one is pencilled in before the next, so two open exams at the same time never get the same room or person.
 */
export function withSuggestions(issues: ScheduleIssue[], entries: ExamEntry[], loads: InvigilatorLoad[]): ScheduleIssue[] {
  const working = entries.map((entry) => ({ ...entry, rooms: [...entry.rooms], invigilators: [...entry.invigilators] }));
  const byId = new Map(working.map((entry) => [entry.id, entry]));
  const hours = loads.map((load) => ({ ...load }));
  const order = [...issues.keys()].sort((a, b) => (issues[a]!.date ?? "9999").localeCompare(issues[b]!.date ?? "9999"));
  const result = [...issues];

  for (const index of order) {
    const issue = issues[index]!;
    // For a clash, move the second exam (usually the one booked later).
    const entry = byId.get(issue.examIds.at(-1) ?? "");
    if (!entry) continue;
    const parts: string[] = [];

    if (issue.kind === "missing-room" || issue.kind === "room-clash") {
      const current = issue.kind === "room-clash" ? entry.rooms : [];
      const others = working.map((other) => (other === entry ? { ...other, rooms: [] } : other));
      const rooms = suggestRooms({ ...entry, rooms: [] }, others).filter((rule) => !rule.rooms.some((room) => current.includes(room)));
      const prefix = issue.kind === "room-clash" ? `ย้าย ${entry.title} ไป` : "ห้องที่ว่าง";
      parts.push(rooms.length ? `${prefix}: ${rooms.slice(0, 3).map(roomLabel).join(" · หรือ ")}` : "ไม่มีห้องว่างในช่วงเวลานี้ — ต้องเลื่อนเวลา");
      if (rooms[0]) entry.rooms = [...rooms[0].rooms];
    }

    if (issue.kind === "missing-room" || issue.kind === "missing-invigilator" || issue.kind === "invigilator-clash" || issue.kind === "resigned-invigilator") {
      const needed = entry.rooms.length >= 2 ? 4 : 2;
      const clashing = issue.kind === "invigilator-clash" ? new Set(byId.get(issue.examIds[0] ?? "")?.invigilators ?? []) : new Set<string>();
      const stay = entry.invigilators.filter((name) => !RESIGNED_INVIGILATORS.includes(name) && !clashing.has(name));
      const people = suggestInvigilators({ ...entry, invigilators: stay }, working, hours, Math.max(0, needed - stay.length));
      if (people.length) {
        parts.push(`กรรมการที่ว่างและชั่วโมงน้อยสุด: ${people.join(", ")}`);
        entry.invigilators = [...stay, ...people];
        for (const name of people) {
          const load = hours.find((candidate) => candidate.name === name);
          if (load) load.total += entry.hours ?? 2;
        }
      }
    }

    if (parts.length) result[index] = { ...issue, suggestion: parts.join(" · ") };
  }
  return result;
}
