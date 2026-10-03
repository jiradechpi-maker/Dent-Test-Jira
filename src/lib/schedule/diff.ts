import { formatDay } from "@/lib/i18n/dates";
import type { Bi, Locale } from "@/lib/i18n/locale";
import { cleanText } from "@/lib/sheets/text";
import type { ExamEntry } from "./invigilation";
import type { TeachingSession } from "./teaching";

/**
 * One tracked session or exam. Snapshots are kept in the browser, so everything here is language-neutral —
 * sheet titles, ISO dates and {@link NONE} for a missing part. Words are added only when a change is shown.
 */
export interface SnapshotItem {
  /** Title as written in the sheet. */
  label: string;
  /** Student year of an exam, shown after its title. */
  year?: number | null;
  value: string;
  date: string | null;
}

/** A compact, JSON-friendly fingerprint of a schedule: identity key → what the user cares about. */
export interface Snapshot {
  takenAt: string;
  items: Record<string, SnapshotItem>;
}

export type ChangeKind = "added" | "removed" | "changed";

export interface Change {
  key: string;
  kind: ChangeKind;
  label: Bi;
  before: Bi | null;
  after: Bi | null;
  date: string | null;
}

/** Stands for a missing date, room list or invigilator list inside an exam's stored value. */
const NONE = "—";
/** Separates an exam's when · rooms · invigilators in its stored value. */
const PART = " · ";

/** What a missing part of an exam's value means, by position. */
const MISSING: Bi[] = [
  { th: "ยังไม่มีวัน", en: "No date yet" },
  { th: "ยังไม่มีห้อง", en: "No room yet" },
  { th: "ยังไม่มีกรรมการ", en: "No invigilators yet" },
];

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
    const when = entry.date ? `${entry.date} ${entry.start ?? ""}–${entry.end ?? ""}` : NONE;
    const rooms = entry.rooms.length ? entry.rooms.join(", ") : NONE;
    const people = entry.invigilators.length ? entry.invigilators.join(", ") : NONE;
    items[key] = { label: entry.title, year: entry.year, value: [when, rooms, people].join(PART), date: entry.date };
  }
  return { takenAt, items };
}

/**
 * Snapshots saved before the English UI wrote Thai placeholders into exam values and "(ปี 4)" into exam
 * labels. Read them in today's neutral form so an old baseline does not report every exam as changed.
 */
const LEGACY_MISSING = /ยังไม่มี(?:วัน|ห้อง|กรรมการ)/g;
const LEGACY_YEAR = /^(.*) \(ปี (\d+)\)$/;

function upgrade(key: string, item: SnapshotItem): SnapshotItem {
  if (!key.startsWith("e:") || item.year !== undefined) return item;
  const year = LEGACY_YEAR.exec(item.label);
  return {
    ...item,
    label: year ? year[1]! : item.label,
    year: year ? Number(year[2]) : null,
    value: item.value.replace(LEGACY_MISSING, NONE),
  };
}

function describeLabel(item: SnapshotItem): Bi {
  if (!item.year) return { th: item.label, en: item.label };
  return { th: `${item.label} (ปี ${item.year})`, en: `${item.label} (Year ${item.year})` };
}

/** "2026-10-21 09:00–11:00" → Thai unchanged (as before) · "Wed 21 Oct 2026, 09:00–11:00". */
function describeWhen(part: string, locale: Locale): string {
  const match = /^(\d{4}-\d{2}-\d{2}) (\S*)–(\S*)$/.exec(part);
  if (locale === "th" || !match) return part;
  const [, date, start, end] = match;
  return `${formatDay(date!, "en", "medium")}${start ? `, ${start}${end ? `–${end}` : ""}` : ""}`;
}

function describeValue(value: string): Bi {
  const parts = value.split(PART);
  const render = (locale: Locale) =>
    parts
      .map((part, index) => {
        if (part === NONE) return MISSING[index]?.[locale] ?? part;
        return index === 0 ? describeWhen(part, locale) : part;
      })
      .join(PART);
  return { th: render("th"), en: render("en") };
}

export function diffSnapshots(before: Snapshot, after: Snapshot): Change[] {
  const changes: Change[] = [];
  const old = (key: string) => {
    const item = before.items[key];
    return item ? upgrade(key, item) : undefined;
  };
  const change = (key: string, kind: ChangeKind, item: SnapshotItem, from: string | null, to: string | null): Change => ({
    key,
    kind,
    label: describeLabel(item),
    before: from === null ? null : describeValue(from),
    after: to === null ? null : describeValue(to),
    date: item.date,
  });

  for (const [key, item] of Object.entries(after.items)) {
    const previous = old(key);
    if (!previous) changes.push(change(key, "added", item, null, item.value));
    else if (previous.value !== item.value) changes.push(change(key, "changed", item, previous.value, item.value));
  }
  for (const key of Object.keys(before.items)) {
    const item = old(key)!;
    if (!after.items[key]) changes.push(change(key, "removed", item, item.value, null));
  }
  const order: Record<ChangeKind, number> = { changed: 0, added: 1, removed: 2 };
  return changes.sort((a, b) => order[a.kind] - order[b.kind] || (a.date ?? "").localeCompare(b.date ?? ""));
}
