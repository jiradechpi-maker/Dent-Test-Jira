import { addDaysIso, mondayOfIso } from "@/lib/i18n/calendar";
import { formatDay, formatStamp, formatTimeAgo, formatTimeSpan } from "@/lib/i18n/dates";
import type { Locale } from "@/lib/i18n/locale";

/** "2026-10-21" → "พ. 21 ต.ค." · "Wed 21 Oct" */
export function shortDay(iso: string, locale: Locale): string {
  return formatDay(iso, locale, "short");
}

/** "2026-10-21" → "พุธ 21 ต.ค. 69" · "Wed 21 Oct 2026" */
export function mediumDay(iso: string, locale: Locale): string {
  return formatDay(iso, locale, "medium");
}

/** "13:00","16:00" → "13.00–16.00" · "13:00–16:00" */
export function timeSpan(start: string | null, end: string | null, locale: Locale): string {
  return formatTimeSpan(start, end, locale);
}

/** "2026-10-02T09:58:00Z" → "5 นาทีที่ผ่านมา" · "5 minutes ago". */
export function timeAgo(iso: string, now: number, locale: Locale): string {
  return formatTimeAgo(iso, locale, now);
}

/** Full Bangkok timestamp, e.g. "2 ต.ค. 69 16:14" · "2 Oct 2026, 16:14". */
export function stamp(iso: string, locale: Locale): string {
  return formatStamp(iso, locale);
}

/** Monday of the week containing `iso`. */
export function mondayOf(iso: string): string {
  return mondayOfIso(iso);
}

export function addDays(iso: string, days: number): string {
  return addDaysIso(iso, days);
}
