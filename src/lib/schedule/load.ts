import type { ExamEntry, InvigilationBook } from "./invigilation";

export interface InvigilatorLoad {
  name: string;
  /** Hours already tallied in the workbook's summary tab. */
  recorded: number;
  /** Hours from monthly tabs that the summary tab does not list yet. */
  planned: number;
  total: number;
  pending: ExamEntry[];
}

const round = (n: number) => Math.round(n * 100) / 100;

function entryHours(entry: ExamEntry): number {
  if (entry.hours) return entry.hours;
  if (!entry.start || !entry.end) return 0;
  const [sh, sm] = entry.start.split(":").map(Number);
  const [eh, em] = entry.end.split(":").map(Number);
  return round((eh! * 60 + em! - (sh! * 60 + sm!)) / 60);
}

/** Per-person invigilation hours: what the summary tab already counts plus assignments it has not picked up yet. */
export function invigilatorLoads(book: InvigilationBook): InvigilatorLoad[] {
  const summary = book.summary;
  const inSummary = new Set((summary?.columns ?? []).map((column) => `${column.date}|${column.start}`));
  const loads = new Map<string, InvigilatorLoad>();
  const get = (name: string) => {
    let load = loads.get(name);
    if (!load) {
      load = { name, recorded: 0, planned: 0, total: 0, pending: [] };
      loads.set(name, load);
    }
    return load;
  };

  for (const person of summary?.people ?? []) get(person.name).recorded = person.hours;

  for (const entry of book.entries) {
    if (!entry.date || !entry.start || entry.postponed) continue;
    if (inSummary.has(`${entry.date}|${entry.start}`)) continue;
    for (const name of entry.invigilators) {
      const load = get(name);
      load.planned = round(load.planned + entryHours(entry));
      load.pending.push(entry);
    }
  }

  return [...loads.values()]
    .map((load) => ({ ...load, total: round(load.recorded + load.planned) }))
    .sort((a, b) => a.total - b.total || a.name.localeCompare(b.name));
}
