import { cellRef, cellText, getCell, mergeAt, textAt, type Grid } from "@/lib/sheets/grid";
import { cleanText, isoFromSheetDate, minutesOf, parseLooseDate, parseTimeRange, timeOf } from "@/lib/sheets/text";

export type SessionKind = "lecture" | "lab" | "exam" | "clinic" | "research" | "elective" | "holiday" | "event";

export interface CourseLegend {
  name: string;
  credits: string | null;
  color: string;
  row: number;
}

export interface TeachingSession {
  /** Sheet cell of the session's top-left corner, e.g. "F8" — unique within one sync. */
  id: string;
  date: string;
  start: string;
  end: string;
  title: string;
  instructors: string[];
  course: string | null;
  color: string | null;
  kind: SessionKind;
  /** Student group for clinic rotations ("Group 3"), when the sheet splits a day into group rows. */
  group: string | null;
  /** Original date when the sheet notes a move, e.g. "(ย้ายมาจาก 21/10/26)". */
  movedFrom: string | null;
  week: number | null;
  semester: number | null;
}

/** Text that sits outside the week's time grid (parked or unconfirmed sessions) — never guessed into a slot. */
export interface OffGridNote {
  id: string;
  date: string | null;
  text: string;
}

export interface TeachingSchedule {
  sheetName: string;
  title: string | null;
  sessions: TeachingSession[];
  notes: OffGridNote[];
  courses: CourseLegend[];
}

const DATE_COLUMN = 3;
const FIRST_SLOT_COLUMN = 4;
const LEGEND_COLUMNS = [1, 2];

interface Slot {
  start: number;
  end: number;
}

/**
 * Parse the faculty's weekly-grid teaching schedule: one row per day (date in column C), one column per
 * half hour starting at column D, with a "Date/ Time" header row at the top of every week block.
 */
export function parseTeachingSchedule(grid: Grid): TeachingSchedule {
  const courses = readLegend(grid);
  const sessions: TeachingSession[] = [];
  const notes: OffGridNote[] = [];
  let title: string | null = null;
  let semester: number | null = null;
  let week: number | null = null;
  let slots = new Map<number, Slot>();
  let currentDate: string | null = null;

  for (let row = 1; row <= grid.rowCount; row++) {
    const marker = getCell(grid, row, DATE_COLUMN)?.value ?? null;
    const markerText = marker instanceof Date ? "" : cellText(marker);

    const semesterMatch = /semester\s*(\d)/i.exec(markerText);
    if (semesterMatch) {
      semester = Number(semesterMatch[1]);
      title ??= cleanText(markerText);
      currentDate = null;
      continue;
    }
    const weekMatch = /^week\s*(\d+)/i.exec(markerText);
    if (weekMatch) {
      week = Number(weekMatch[1]);
      currentDate = null;
      collectNotes(grid, row, null, notes);
      continue;
    }
    if (/date\s*\/?\s*time/i.test(markerText)) {
      slots = readHeader(grid, row);
      currentDate = null;
      continue;
    }

    if (marker instanceof Date) currentDate = isoFromSheetDate(marker);
    else if (markerText && parseLooseDate(markerText)) currentDate = parseLooseDate(markerText);
    else if (markerText) {
      // Free-text separators such as "ช่วงติว NL" end the previous day.
      currentDate = null;
      continue;
    }

    const isGroupRow = marker === null && currentDate !== null;
    for (let col = FIRST_SLOT_COLUMN; col <= grid.columnCount; col++) {
      const cell = getCell(grid, row, col);
      const raw = cell ? cellText(cell.value) : "";
      if (!raw || cell?.value instanceof Date) continue;
      const text = cleanText(raw);
      const id = cellRef(row, col);
      const merge = mergeAt(grid, row, col);
      const lastCol = merge ? merge.right : col;
      const first = slots.get(col);

      if (!currentDate || !first) {
        notes.push({ id, date: currentDate, text });
        continue;
      }
      let last = first;
      for (let c = lastCol; c >= col; c--) {
        const slot = slots.get(c);
        if (slot) {
          last = slot;
          break;
        }
      }
      const course = matchCourse(courses, cell?.fill ?? null, row);
      const kind = classifySession(text, isGroupRow);
      sessions.push({
        id,
        date: currentDate,
        start: timeOf(first.start),
        end: timeOf(last.end),
        title: text,
        instructors: kind === "holiday" ? [] : extractInstructors(text),
        course: course?.name ?? null,
        color: cell?.fill ?? null,
        kind,
        group: extractGroup(text),
        movedFrom: extractMovedFrom(text),
        week,
        semester,
      });
    }
  }

  sessions.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  return { sheetName: grid.name, title, sessions, notes, courses };
}

function collectNotes(grid: Grid, row: number, date: string | null, notes: OffGridNote[]): void {
  for (let col = FIRST_SLOT_COLUMN; col <= grid.columnCount; col++) {
    const text = cleanText(cellText(getCell(grid, row, col)?.value ?? null));
    if (text) notes.push({ id: cellRef(row, col), date, text });
  }
}

/** Map each grid column to its time slot. A header "13.00-14.00" spanning two columns gives two 30-minute slots. */
function readHeader(grid: Grid, row: number): Map<number, Slot> {
  const headers: { col: number; start: number; end: number }[] = [];
  for (let col = FIRST_SLOT_COLUMN; col <= grid.columnCount; col++) {
    const range = parseTimeRange(textAt(grid, row, col));
    if (range && getCell(grid, row, col)) headers.push({ col, start: minutesOf(range.start), end: minutesOf(range.end) });
  }
  const slots = new Map<number, Slot>();
  headers.forEach((header, index) => {
    const next = headers[index + 1];
    const previous = headers[index - 1];
    const merge = mergeAt(grid, row, header.col);
    const width = next ? next.col - header.col : merge ? merge.right - merge.left + 1 : previous ? header.col - previous.col : 1;
    const step = (header.end - header.start) / width;
    for (let offset = 0; offset < width; offset++) {
      slots.set(header.col + offset, { start: header.start + step * offset, end: header.start + step * (offset + 1) });
    }
  });
  return slots;
}

function readLegend(grid: Grid): CourseLegend[] {
  const legend: CourseLegend[] = [];
  for (let row = 1; row <= grid.rowCount; row++) {
    for (const col of LEGEND_COLUMNS) {
      const cell = getCell(grid, row, col);
      if (!cell?.fill || typeof cell.value !== "string" || !cell.value.trim()) continue;
      const lines = cell.value
        .split(/\n/)
        .map((line) => cleanText(line))
        .filter(Boolean);
      const joined = lines.join(" ");
      const credits = /\d\(\d-\d-\d\)/.exec(joined)?.[0] ?? null;
      const name = cleanText(joined.replace(/\d\(\d-\d-\d\)/, "").replace(/\(\d+\s*hr\)/i, ""));
      legend.push({ name, credits, color: cell.fill, row });
    }
  }
  return legend;
}

function colorDistance(a: string, b: string): number {
  const channels = (hex: string) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [r1, g1, b1] = channels(a);
  const [r2, g2, b2] = channels(b);
  return Math.hypot(r1! - r2!, g1! - g2!, b1! - b2!);
}

/**
 * The sheet colours each session like its course's legend cell, but shades drift slightly and two courses
 * can share a colour. Take legends with a near-identical colour and prefer the latest one introduced at or
 * above the session's row (a course's legend sits beside its first week).
 */
function matchCourse(courses: CourseLegend[], fill: string | null, row: number): CourseLegend | null {
  if (!fill) return null;
  const close = courses
    .map((course) => ({ course, distance: colorDistance(course.color, fill) }))
    .filter((candidate) => candidate.distance <= 24);
  if (close.length === 0) return null;
  const exact = close.filter((candidate) => candidate.distance === 0);
  const pool = exact.length > 0 ? exact : close;
  const above = pool.filter((candidate) => candidate.course.row <= row).sort((a, b) => b.course.row - a.course.row);
  if (above[0]) return above[0].course;
  return pool.sort((a, b) => a.distance - b.distance || a.course.row - b.course.row)[0]!.course;
}

export function classifySession(title: string, isGroupRow = false): SessionKind {
  const t = title.toLowerCase();
  if (/day\s*off|holiday|วันหยุด/.test(t)) return "holiday";
  if (/\b(midterm|final|pretest|posttest)\b|สอบ|\bexa[mn]\b|^examination\b|examination\s*(:|$)/.test(t)) return "exam";
  if (/^research\b/.test(t)) return "research";
  if (/^elective\b/.test(t)) return "elective";
  if (isGroupRow || /\bclinic\b|^cc\s*\d+/.test(t)) return "clinic";
  if (/\blab\b|laboratory/.test(t)) return "lab";
  if (/ceremony|พิธี|prevention and management|กิจกรรม|ชุมชน|outreach/.test(t)) return "event";
  return "lecture";
}

/** "Lab 1: ... (Kuson/ Nuannapa/Napat)" → ["Kuson", "Nuannapa", "Napat"]. */
export function extractInstructors(title: string): string[] {
  const groups = [...title.matchAll(/\(([^()]+)\)/g)].map((match) => match[1]!.trim());
  const last = groups.at(-1);
  if (!last || /^group\b|\d+\s*hr|^\d/i.test(last)) return [];
  const names = last
    .split(/\s*[/,]\s*|\s+and\s+|\s*&\s*/i)
    .map((name) => name.replace(/^(aj|a\.|อ)\.?\s*/i, "").trim())
    .filter(
      (name) =>
        /^[A-Za-zก-๙][A-Za-zก-๙ .'-]{1,30}$/.test(name) &&
        !/^(cont|faculty|intro|midterm|final|lecture|lab|exam|ย้าย|ใช้)/i.test(name),
    );
  return names;
}

function extractGroup(title: string): string | null {
  const match = /\(?\bgroup\s*(\d+)\)?/i.exec(title);
  return match ? `Group ${match[1]}` : null;
}

function extractMovedFrom(title: string): string | null {
  const match = /ย้ายมาจาก\s*(?:วันที่)?\s*([\d/.-]+)/.exec(title) ?? /moved\s+from\s+([\d/.-]+)/i.exec(title);
  return match ? parseLooseDate(match[1]!) : null;
}
