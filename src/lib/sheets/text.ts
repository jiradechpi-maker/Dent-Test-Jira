/** Text clean-up and date/time parsing shared by the spreadsheet parsers. */

/** Collapse tabs, newlines and repeated spaces into single spaces. */
export function cleanText(value: string): string {
  return value.replace(/[\t\r\n ]+/g, " ").replace(/ {2,}/g, " ").trim();
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** A JS Date produced by an xlsx reader (midnight UTC for date-only cells) → "YYYY-MM-DD". */
export function isoFromSheetDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

/**
 * Thai-office date strings → ISO. Accepts "Thu. 08-10-69", "Tue. 9-6-69 ", "Wed. 15-07-69",
 * "27/10/2026", "Thu., 08-10-2026". Two-digit years ≥ 50 are Buddhist era (69 → 2569 → 2026);
 * smaller ones are Christian era (26 → 2026), as in "ย้ายมาจาก 21/10/26".
 */
export function parseLooseDate(input: string): string | null {
  const match = /(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{2,4})/.exec(input);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += year >= 50 ? 2500 : 2000;
  if (year > 2400) year -= 543;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export interface TimeRange {
  start: string;
  end: string;
}

/** "09.00-11.00", "(9.00-12.00)", "13:00 - 16:00" → {start:"09:00", end:"11:00"}. */
export function parseTimeRange(input: string): TimeRange | null {
  const match = /(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/.exec(input);
  if (!match) return null;
  const start = `${pad2(Number(match[1]))}:${match[2]}`;
  const end = `${pad2(Number(match[3]))}:${match[4]}`;
  if (minutesOf(end) <= minutesOf(start)) return null;
  return { start, end };
}

export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function timeOf(minutes: number): string {
  const rounded = Math.round(minutes);
  return `${pad2(Math.floor(rounded / 60))}:${pad2(rounded % 60)}`;
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return minutesOf(a.start) < minutesOf(b.end) && minutesOf(b.start) < minutesOf(a.end);
}

/** Lower-cased word tokens without punctuation or common filler words, for fuzzy title matching. */
export function titleTokens(value: string): Set<string> {
  const stop = new Set(["and", "of", "the", "in", "for", "to", "a", "exam", "examination", "midterm", "final", "lab", "i", "ii", "iii"]);
  return new Set(
    value
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ")
      .split(/[^a-z0-9ก-๙]+/)
      .filter((token) => token.length > 2 && !stop.has(token)),
  );
}
