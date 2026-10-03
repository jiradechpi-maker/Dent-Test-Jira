/**
 * Locale-aware calendar formatting. Thai shows the Buddhist era (พ.ศ.) the way Thai offices write dates;
 * English shows the Gregorian year with the day before the month ("Wed 21 Oct 2026") — unambiguous for
 * readers used to either 21/10 or 10/21. Calendar dates stay "YYYY-MM-DD" strings, never Date objects.
 */
import { THAI_MONTHS, THAI_MONTHS_SHORT, THAI_WEEKDAYS, THAI_WEEKDAYS_SHORT, toBuddhistYear } from "@/lib/thai";
import type { Locale } from "./locale";

export const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
export const EN_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
/** Index 0 = Sunday, matching Date#getUTCDay(). */
export const EN_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const EN_WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y: y!, m: m!, d: d!, weekday: new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay() };
}

export function monthName(month: number, locale: Locale, style: "long" | "short" = "long"): string {
  if (locale === "en") return (style === "long" ? EN_MONTHS : EN_MONTHS_SHORT)[month - 1] ?? "";
  return (style === "long" ? THAI_MONTHS : THAI_MONTHS_SHORT)[month - 1] ?? "";
}

export function weekdayName(weekday: number, locale: Locale, style: "long" | "short" = "long"): string {
  if (locale === "en") return (style === "long" ? EN_WEEKDAYS : EN_WEEKDAYS_SHORT)[weekday] ?? "";
  return (style === "long" ? THAI_WEEKDAYS : THAI_WEEKDAYS_SHORT)[weekday] ?? "";
}

/** The year as each audience writes it: 2569 (B.E.) in Thai, 2026 in English. */
export function displayYear(gregorianYear: number, locale: Locale): number {
  return locale === "th" ? toBuddhistYear(gregorianYear) : gregorianYear;
}

/**
 * short:  "พ. 21 ต.ค."            · "Wed 21 Oct"
 * medium: "พุธ 21 ต.ค. 69"        · "Wed 21 Oct 2026"
 * long:   "วันพุธที่ 21 ตุลาคม 2569" · "Wednesday 21 October 2026"
 */
export function formatDay(iso: string, locale: Locale, style: "short" | "medium" | "long" = "medium"): string {
  const { y, m, d, weekday } = parts(iso);
  if (locale === "en") {
    if (style === "short") return `${EN_WEEKDAYS_SHORT[weekday]} ${d} ${EN_MONTHS_SHORT[m - 1]}`;
    if (style === "medium") return `${EN_WEEKDAYS_SHORT[weekday]} ${d} ${EN_MONTHS_SHORT[m - 1]} ${y}`;
    return `${EN_WEEKDAYS[weekday]} ${d} ${EN_MONTHS[m - 1]} ${y}`;
  }
  if (style === "short") return `${THAI_WEEKDAYS_SHORT[weekday]}. ${d} ${THAI_MONTHS_SHORT[m - 1]}`;
  if (style === "medium") return `${THAI_WEEKDAYS[weekday]} ${d} ${THAI_MONTHS_SHORT[m - 1]} ${String(toBuddhistYear(y)).slice(-2)}`;
  return `วัน${THAI_WEEKDAYS[weekday]}ที่ ${d} ${THAI_MONTHS[m - 1]} ${toBuddhistYear(y)}`;
}

/** "2026-10" → "ตุลาคม 2569" · "October 2026". */
export function formatMonthYear(yyyyMm: string, locale: Locale, style: "long" | "short" = "long"): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return `${monthName(m!, locale, style)} ${displayYear(y!, locale)}`;
}

/** "13:00" → "13.00" (Thai official style) · "13:00". */
export function formatTime(hhmm: string, locale: Locale): string {
  return locale === "th" ? hhmm.replace(":", ".") : hhmm;
}

/** "13:00","16:00" → "13.00–16.00" · "13:00–16:00". */
export function formatTimeSpan(start: string | null, end: string | null, locale: Locale): string {
  if (!start) return locale === "th" ? "ไม่ระบุเวลา" : "No time set";
  return `${formatTime(start, locale)}${end ? `–${formatTime(end, locale)}` : ""}`;
}

/** Bangkok wall-clock parts of an instant, independent of the viewer's time zone. */
export function bangkokParts(date: Date) {
  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => local.find((part) => part.type === type)?.value ?? "";
  return { iso: `${get("year")}-${get("month")}-${get("day")}`, hh: get("hour"), mm: get("minute") };
}

/** An instant in Bangkok time: "2 ต.ค. 69 16:14" · "2 Oct 2026, 16:14". */
export function formatStamp(isoInstant: string, locale: Locale): string {
  const { iso, hh, mm } = bangkokParts(new Date(isoInstant));
  const { y, m, d } = parts(iso);
  if (locale === "en") return `${d} ${EN_MONTHS_SHORT[m - 1]} ${y}, ${hh}:${mm}`;
  return `${d} ${THAI_MONTHS_SHORT[m - 1]} ${String(toBuddhistYear(y)).slice(-2)} ${hh}:${mm}`;
}

/** "5 นาทีที่ผ่านมา" · "5 minutes ago". */
export function formatTimeAgo(isoInstant: string, locale: Locale, now = Date.now()): string {
  const seconds = Math.round((Date.parse(isoInstant) - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return locale === "th" ? "เมื่อสักครู่" : "just now";
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  return relative.format(Math.round(seconds / 86_400), "day");
}

/** Thai academic year 2569 runs from mid-2026, so it is "Academic Year 2026" in English. */
export function formatAcademicYear(buddhistYear: number, locale: Locale): string {
  return locale === "th" ? `ปีการศึกษา ${buddhistYear}` : `Academic Year ${buddhistYear - 543}`;
}

/** 1.5 → "1.5 ชม." · "1.5 h". */
export function formatHoursShort(hours: number, locale: Locale): string {
  const n = Number.isInteger(hours) ? String(hours) : String(Math.round(hours * 100) / 100);
  return locale === "th" ? `${n} ชม.` : `${n} h`;
}
