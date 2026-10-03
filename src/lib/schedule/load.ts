import type { ExamEntry, InvigilationBook, SummaryColumn } from "./invigilation";

export interface InvigilatorLoad {
  name: string;
  /** Hours exactly as the summary tab's "ชั่วโมงรวมทั้งหมด" shows them. */
  recorded: number;
  /** Hours of exams today or later that the summary tab does not list yet. */
  planned: number;
  /** Hours of past exams in a monthly tab that never made it into the summary tab. */
  unrecorded: number;
  /** recorded + planned + unrecorded — used to share out new work fairly. */
  total: number;
  pending: ExamEntry[];
  missing: ExamEntry[];
}

const round = (n: number) => Math.round(n * 100) / 100;

function entryHours(entry: ExamEntry): number {
  if (entry.hours) return entry.hours;
  if (!entry.start || !entry.end) return 0;
  const [sh, sm] = entry.start.split(":").map(Number);
  const [eh, em] = entry.end.split(":").map(Number);
  return round((eh! * 60 + em! - (sh! * 60 + sm!)) / 60);
}

const IGNORED_WORDS = new Set(["and", "for", "the", "of", "in", "to", "exam", "examination", "midterm", "final", "lab", "test", "i", "ii", "iii"]);

function titleWords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ")
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3 && !IGNORED_WORDS.has(word))
      .map((word) => word.slice(0, 6)),
  );
}

/** Same course when most of the shorter title's words appear in the other ("Clinical anatomy in dentistry" ≈ "Clinical Anatomy in Dentistry (Final)"). */
export function sameCourse(a: string, b: string): boolean {
  const left = titleWords(a);
  const right = titleWords(b);
  const smaller = Math.min(left.size, right.size);
  if (!smaller) return false;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;
  return shared / smaller >= 0.6;
}

/**
 * Does the summary tab already count this monthly-tab exam? The two tabs are typed separately, so the time
 * often differs (e.g. 10:00 in the month tab, 13:00 in the summary). Same day plus same start, same course,
 * or the same invigilators is enough.
 */
function inSummary(entry: ExamEntry, columns: SummaryColumn[], peopleByColumn: Map<number, Set<string>>): boolean {
  return columns.some((column, index) => {
    if (column.date !== entry.date) return false;
    if (column.start === entry.start) return true;
    if (sameCourse(column.title, entry.title)) return true;
    const people = peopleByColumn.get(index);
    return entry.invigilators.length > 0 && entry.invigilators.every((name) => people?.has(name));
  });
}

/** Per-person invigilation hours: the summary tab's own totals, plus exams it has not picked up yet. */
export function invigilatorLoads(book: InvigilationBook, today: string = new Date().toISOString().slice(0, 10)): InvigilatorLoad[] {
  const summary = book.summary;
  const columns = summary?.columns ?? [];
  const peopleByColumn = new Map<number, Set<string>>();
  for (const person of summary?.people ?? []) {
    for (const index of person.assignments) {
      if (!peopleByColumn.has(index)) peopleByColumn.set(index, new Set());
      peopleByColumn.get(index)!.add(person.name);
    }
  }

  const loads = new Map<string, InvigilatorLoad>();
  const get = (name: string) => {
    let load = loads.get(name);
    if (!load) {
      load = { name, recorded: 0, planned: 0, unrecorded: 0, total: 0, pending: [], missing: [] };
      loads.set(name, load);
    }
    return load;
  };

  for (const person of summary?.people ?? []) get(person.name).recorded = person.hours;

  for (const entry of book.entries) {
    if (!entry.date || !entry.start || entry.postponed) continue;
    if (inSummary(entry, columns, peopleByColumn)) continue;
    const past = entry.date < today;
    for (const name of entry.invigilators) {
      const load = get(name);
      if (past) {
        load.unrecorded = round(load.unrecorded + entryHours(entry));
        load.missing.push(entry);
      } else {
        load.planned = round(load.planned + entryHours(entry));
        load.pending.push(entry);
      }
    }
  }

  return [...loads.values()]
    .map((load) => ({ ...load, total: round(load.recorded + load.planned + load.unrecorded) }))
    .sort((a, b) => a.total - b.total || a.name.localeCompare(b.name));
}

/** Past exams in the monthly tabs that the summary tab never counted — one line per exam for the staff to fix. */
export function missingFromSummary(loads: InvigilatorLoad[]): { entry: ExamEntry; people: string[] }[] {
  const byId = new Map<string, { entry: ExamEntry; people: string[] }>();
  for (const load of loads) {
    for (const entry of load.missing) {
      const item = byId.get(entry.id) ?? { entry, people: [] };
      item.people.push(load.name);
      byId.set(entry.id, item);
    }
  }
  return [...byId.values()].sort((a, b) => `${a.entry.date} ${a.entry.start}`.localeCompare(`${b.entry.date} ${b.entry.start}`));
}
