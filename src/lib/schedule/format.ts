import { THAI_MONTHS_SHORT, THAI_WEEKDAYS, THAI_WEEKDAYS_SHORT, toBuddhistYear } from "@/lib/thai";

const parts = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y: y!, m: m!, d: d!, weekday: new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay() };
};

/** "2026-10-21" → "พ. 21 ต.ค." */
export function shortDay(iso: string): string {
  const { m, d, weekday } = parts(iso);
  return `${THAI_WEEKDAYS_SHORT[weekday]}. ${d} ${THAI_MONTHS_SHORT[m - 1]}`;
}

/** "2026-10-21" → "พุธ 21 ต.ค. 69" */
export function mediumDay(iso: string): string {
  const { y, m, d, weekday } = parts(iso);
  return `${THAI_WEEKDAYS[weekday]} ${d} ${THAI_MONTHS_SHORT[m - 1]} ${String(toBuddhistYear(y)).slice(-2)}`;
}

/** "13:00","16:00" → "13.00–16.00" */
export function timeSpan(start: string | null, end: string | null): string {
  if (!start) return "ไม่ระบุเวลา";
  return `${start.replace(":", ".")}${end ? `–${end.replace(":", ".")}` : ""}`;
}

const relative = new Intl.RelativeTimeFormat("th", { numeric: "auto" });

/** "2026-10-02T09:58:00Z" → "5 นาทีที่ผ่านมา". */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return "เมื่อสักครู่";
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  return relative.format(Math.round(seconds / 86_400), "day");
}

/** Full Bangkok timestamp, e.g. "2 ต.ค. 69 16:14". */
export function stamp(iso: string): string {
  const date = new Date(iso);
  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => local.find((part) => part.type === type)?.value ?? "";
  const y = Number(get("year"));
  return `${Number(get("day"))} ${THAI_MONTHS_SHORT[Number(get("month")) - 1]} ${String(toBuddhistYear(y)).slice(-2)} ${get("hour")}:${get("minute")}`;
}

/** Monday of the week containing `iso`. */
export function mondayOf(iso: string): string {
  const { y, m, d, weekday } = parts(iso);
  const date = new Date(Date.UTC(y, m - 1, d - ((weekday + 6) % 7)));
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const { y, m, d } = parts(iso);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
