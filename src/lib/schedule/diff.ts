import { cleanText } from "@/lib/sheets/text";
import type { ExamEntry } from "./invigilation";
import type { TeachingSession } from "./teaching";

/** A compact, JSON-friendly fingerprint of a schedule: identity key → what the user cares about. */
export interface Snapshot {
  takenAt: string;
  items: Record<string, { label: string; value: string; date: string | null }>;
}

export type ChangeKind = "added" | "removed" | "changed";

export interface Change {
  key: string;
  kind: ChangeKind;
  label: string;
  before: string | null;
  after: string | null;
  date: string | null;
}

/** Identical titles (e.g. "Research 3" appears once, "CC1" group rows repeat) get an occurrence suffix. */
function withOccurrence<T>(items: T[], baseKey: (item: T) => string): [string, T][] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const base = baseKey(item);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return [n === 1 ? base : `${base}#${n}`, item];
  });
}

const norm = (value: string) => cleanText(value).toLowerCase();

export function teachingSnapshot(sessions: TeachingSession[], takenAt: string): Snapshot {
  const items: Snapshot["items"] = {};
  for (const [key, session] of withOccurrence(sessions, (s) => `t:${norm(s.title)}|${s.group ?? ""}`)) {
    items[key] = { label: session.title, value: `${session.date} ${session.start}–${session.end}`, date: session.date };
  }
  return { takenAt, items };
}

export function examSnapshot(entries: ExamEntry[], takenAt: string): Snapshot {
  const items: Snapshot["items"] = {};
  for (const [key, entry] of withOccurrence(entries, (e) => `e:${e.code ?? ""}|${norm(e.title)}`)) {
    const when = entry.date ? `${entry.date} ${entry.start ?? ""}–${entry.end ?? ""}` : "ยังไม่มีวัน";
    const rooms = entry.rooms.length ? entry.rooms.join(", ") : "ยังไม่มีห้อง";
    const people = entry.invigilators.length ? entry.invigilators.join(", ") : "ยังไม่มีกรรมการ";
    items[key] = { label: `${entry.title}${entry.year ? ` (ปี ${entry.year})` : ""}`, value: `${when} · ${rooms} · ${people}`, date: entry.date };
  }
  return { takenAt, items };
}

export function diffSnapshots(before: Snapshot, after: Snapshot): Change[] {
  const changes: Change[] = [];
  for (const [key, item] of Object.entries(after.items)) {
    const old = before.items[key];
    if (!old) changes.push({ key, kind: "added", label: item.label, before: null, after: item.value, date: item.date });
    else if (old.value !== item.value) changes.push({ key, kind: "changed", label: item.label, before: old.value, after: item.value, date: item.date });
  }
  for (const [key, item] of Object.entries(before.items)) {
    if (!after.items[key]) changes.push({ key, kind: "removed", label: item.label, before: item.value, after: null, date: item.date });
  }
  const order: Record<ChangeKind, number> = { changed: 0, added: 1, removed: 2 };
  return changes.sort((a, b) => order[a.kind] - order[b.kind] || (a.date ?? "").localeCompare(b.date ?? ""));
}
