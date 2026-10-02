/**
 * Thai language helpers: numerals, Buddhist-era dates and official-document formatting.
 * Pure functions only — safe on both server and client, no timezone surprises
 * (calendar dates are passed around as "YYYY-MM-DD" strings, never as Date objects).
 */

const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"] as const;

export const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

export const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

/** Index 0 = Sunday, matching Date#getUTCDay(). */
export const THAI_WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"] as const;
export const THAI_WEEKDAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;

/** Converts every Arabic digit 0-9 in `input` to a Thai digit ๐-๙. */
export function toThaiDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => THAI_DIGITS[Number(d)] ?? d);
}

/** Converts every Thai digit ๐-๙ in `input` to an Arabic digit 0-9. */
export function toArabicDigits(input: string): string {
  return input.replace(/[๐-๙]/g, (d) => String(d.charCodeAt(0) - 0x0e50));
}

/**
 * Applies Thai digits only when `enabled` — used for the "เลขไทย" switch.
 * Digits that belong to a Latin code (room "DT01", course "DENT411") are left untouched,
 * matching how official letters print them.
 */
export function digits(input: string | number, enabled: boolean): string {
  const text = String(input);
  if (!enabled) return text;
  return text.replace(/[0-9]+/g, (run, offset: number) => {
    const before = offset > 0 ? text[offset - 1] ?? "" : "";
    return /[A-Za-z]/.test(before) ? run : toThaiDigits(run);
  });
}

export interface CalendarDate {
  year: number; // Gregorian (CE)
  month: number; // 1-12
  day: number; // 1-31
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses "YYYY-MM-DD" strictly. Returns null for malformed or impossible dates (e.g. 2026-02-30). */
export function parseIsoDate(value: string): CalendarDate | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

export function weekdayIndex(date: CalendarDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

export function toBuddhistYear(gregorianYear: number): number {
  return gregorianYear + 543;
}

export function toGregorianYear(buddhistYear: number): number {
  return buddhistYear - 543;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function requireDate(value: string): CalendarDate {
  const parsed = parseIsoDate(value);
  if (!parsed) throw new RangeError(`Invalid ISO date: "${value}"`);
  return parsed;
}

/** "2026-09-29" → "อังคารที่ ๒๙/๐๙/๖๙" (format used in the teaching-schedule attachment). */
export function formatScheduleDay(isoDate: string, thaiDigits = true): string {
  const d = requireDate(isoDate);
  const yy = String(toBuddhistYear(d.year)).slice(-2);
  const text = `${THAI_WEEKDAYS[weekdayIndex(d)]}ที่ ${pad2(d.day)}/${pad2(d.month)}/${yy}`;
  return digits(text, thaiDigits);
}

/** "2026-10-19" → "วันจันทร์ที่ ๑๙ ตุลาคม ๒๕๖๙". */
export function formatFullThaiDate(isoDate: string, thaiDigits = true): string {
  const d = requireDate(isoDate);
  const text = `วัน${THAI_WEEKDAYS[weekdayIndex(d)]}ที่ ${d.day} ${THAI_MONTHS[d.month - 1]} ${toBuddhistYear(d.year)}`;
  return digits(text, thaiDigits);
}

/** "2026-09-06" → "๖ กันยายน ๒๕๖๙"; without a day → "กันยายน ๒๕๖๙". */
export function formatLetterDate(isoDate: string, options: { includeDay: boolean; thaiDigits?: boolean }): string {
  const d = requireDate(isoDate);
  const monthYear = `${THAI_MONTHS[d.month - 1]} ${toBuddhistYear(d.year)}`;
  const text = options.includeDay ? `${d.day} ${monthYear}` : monthYear;
  return digits(text, options.thaiDigits ?? true);
}

/** "2026-09-06" → "6 ก.ย. 2569" — compact UI format (always Buddhist era). */
export function formatShortThaiDate(isoDate: string, thaiDigits = false): string {
  const d = requireDate(isoDate);
  return digits(`${d.day} ${THAI_MONTHS_SHORT[d.month - 1]} ${toBuddhistYear(d.year)}`, thaiDigits);
}

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseTime(value: string): { hours: number; minutes: number } | null {
  const match = HH_MM.exec(value);
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

export function timeToMinutes(value: string): number | null {
  const t = parseTime(value);
  return t ? t.hours * 60 + t.minutes : null;
}

/** "13:00","16:00" → "๑๓.๐๐ - ๑๖.๐๐ น." */
export function formatTimeRange(start: string, end: string, thaiDigits = true): string {
  const s = parseTime(start);
  const e = parseTime(end);
  if (!s || !e) throw new RangeError(`Invalid time range: "${start}"-"${end}"`);
  const text = `${pad2(s.hours)}.${pad2(s.minutes)} - ${pad2(e.hours)}.${pad2(e.minutes)} น.`;
  return digits(text, thaiDigits);
}

/** Duration in hours between two "HH:mm" values (same day). Returns 0 when end ≤ start. */
export function hoursBetween(start: string, end: string): number {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (s === null || e === null || e <= s) return 0;
  return Math.round(((e - s) / 60) * 100) / 100;
}

/** 3 → "3", 1.5 → "1.5", 2.25 → "2.25" (no trailing zeros). */
export function formatHours(hours: number, thaiDigits = true): string {
  const text = Number.isInteger(hours) ? String(hours) : String(Math.round(hours * 100) / 100);
  return digits(text, thaiDigits);
}

/** Today's date in Asia/Bangkok as "YYYY-MM-DD" — independent of server timezone. */
export function todayInBangkok(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts; // en-CA yields YYYY-MM-DD
}
