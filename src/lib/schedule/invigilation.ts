import { INVIGILATORS } from "@/config/master-data";
import type { Bi } from "@/lib/i18n/locale";
import { THAI_MONTHS } from "@/lib/thai";
import { cellRef, cellText, getCell, textAt, valueAt, type CellValue, type Grid } from "@/lib/sheets/grid";
import { cleanText, isoFromSheetDate, parseLooseDate, parseTimeRange } from "@/lib/sheets/text";

export interface ExamEntry {
  /** "<sheet>!<row>" */
  id: string;
  sheet: string;
  row: number;
  date: string | null;
  start: string | null;
  end: string | null;
  hours: number | null;
  code: string | null;
  title: string;
  /** Text the staff flagged with *** … *** (e.g. "เลื่อน", "หาวันลงใหม่"). */
  remark: string | null;
  postponed: boolean;
  year: number | null;
  submitBy: string | null;
  paperReceived: boolean | null;
  rooms: string[];
  invigilators: string[];
  done: boolean | null;
}

export interface MonthTab {
  sheet: string;
  /** "2026-10" */
  month: string;
}

export interface SummaryColumn {
  ref: string;
  date: string | null;
  start: string | null;
  end: string | null;
  title: string;
  hours: number;
}

export interface SummaryPerson {
  name: string;
  /** The sheet's own "ชั่วโมงรวมทั้งหมด" for this row when present, otherwise the sum of the marked columns. */
  hours: number;
  /** Indexes into `columns`. */
  assignments: number[];
}

export interface HoursSummary {
  sheet: string;
  columns: SummaryColumn[];
  people: SummaryPerson[];
  /** Mistakes in the summary tab worth fixing in the sheet itself. */
  warnings: Bi[];
}

export interface InvigilationBook {
  months: MonthTab[];
  entries: ExamEntry[];
  summary: HoursSummary | null;
}

const MONTH_TAB = /กรรมการคุมสอบเดือน\s*(\S+?)\s*(\d{2,4})\s*$/;

export function parseInvigilationWorkbook(grids: Grid[]): InvigilationBook {
  const months: MonthTab[] = [];
  const entries: ExamEntry[] = [];
  for (const grid of grids) {
    if (grid.hidden) continue;
    const month = monthOfTab(grid.name);
    if (!month) continue;
    months.push({ sheet: grid.name, month });
    entries.push(...parseMonthTab(grid));
  }
  months.sort((a, b) => a.month.localeCompare(b.month));

  const summaryGrid = grids.find((grid) => !grid.hidden && /ตารางเวลาคุมสอบ/.test(grid.name)) ?? null;
  return {
    months,
    entries: dedupe(entries, months).sort(
      (a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999") || (a.start ?? "").localeCompare(b.start ?? ""),
    ),
    summary: summaryGrid ? parseSummaryTab(summaryGrid) : null,
  };
}

/** "กรรมการคุมสอบเดือนตุลาคม 69" → "2026-10". */
export function monthOfTab(name: string): string | null {
  const match = MONTH_TAB.exec(name.trim());
  if (!match) return null;
  const monthIndex = THAI_MONTHS.findIndex((month) => month === match[1]);
  if (monthIndex < 0) return null;
  let year = Number(match[2]);
  if (year < 100) year += 2500;
  if (year > 2400) year -= 543;
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

type Column = "date" | "time" | "hours" | "code" | "title" | "year" | "submitBy" | "paperReceived" | "room" | "invigilator" | "done";

function readHeader(grid: Grid): { row: number; columns: Partial<Record<Column, number>> } | null {
  for (let row = 1; row <= Math.min(grid.rowCount, 10); row++) {
    const labels = new Map<number, string>();
    for (let col = 1; col <= grid.columnCount; col++) {
      const text = cleanText(cellText(getCell(grid, row, col)?.value ?? null)).toLowerCase();
      if (text) labels.set(col, text);
    }
    if (![...labels.values()].includes("date")) continue;
    const columns: Partial<Record<Column, number>> = {};
    let previous: Column | null = null;
    for (const [col, label] of [...labels.entries()].sort((a, b) => a[0] - b[0])) {
      let column: Column | null = null;
      if (label === "date") column = "date";
      else if (label === "time") column = "time";
      else if (label.startsWith("hour")) column = "hours";
      else if (label === "code") column = "code";
      else if (label.includes("course")) column = "title";
      else if (label.includes("year")) column = "year";
      else if (label.includes("ส่งข้อสอบ")) column = "submitBy";
      else if (label.includes("room")) column = "room";
      else if (label.includes("invigilator")) column = "invigilator";
      else if (label.startsWith("finished")) column = previous === "submitBy" ? "paperReceived" : "done";
      if (column && columns[column] === undefined) columns[column] = col;
      previous = column ?? previous;
    }
    return { row, columns };
  }
  return null;
}

function parseMonthTab(grid: Grid): ExamEntry[] {
  const header = readHeader(grid);
  if (!header) return [];
  const { columns } = header;
  const at = (row: number, column: Column): CellValue => (columns[column] ? valueAt(grid, row, columns[column]) : null);
  const text = (row: number, column: Column) => cleanText(cellText(at(row, column)));
  const raw = (row: number, column: Column) => (columns[column] ? textAt(grid, row, columns[column]) : "");

  const entries: ExamEntry[] = [];
  for (let row = header.row + 1; row <= grid.rowCount; row++) {
    const rawTitle = raw(row, "title");
    const time = parseTimeRange(text(row, "time"));
    if (!rawTitle && !time) continue;

    const { title, remark } = splitRemark(rawTitle);
    const hoursValue = at(row, "hours");
    entries.push({
      id: `${grid.name}!${row}`,
      sheet: grid.name,
      row,
      date: dateOf(at(row, "date")),
      start: time?.start ?? null,
      end: time?.end ?? null,
      hours: typeof hoursValue === "number" ? hoursValue : Number.parseFloat(String(hoursValue ?? "")) || null,
      code: codeOf(at(row, "code")),
      title,
      remark,
      postponed: /เลื่อน|หาวัน|postpone/i.test(rawTitle),
      year: numberOf(at(row, "year")),
      submitBy: dateOf(at(row, "submitBy")),
      paperReceived: booleanOf(at(row, "paperReceived")),
      rooms: splitRooms(raw(row, "room")),
      invigilators: splitInvigilators(raw(row, "invigilator")),
      done: booleanOf(at(row, "done")),
    });
  }
  return entries;
}

/** A row copied into the next month's tab (e.g. a 30 Sep exam repeated at the bottom of October). Keep the tab of its own month. */
function dedupe(entries: ExamEntry[], months: MonthTab[]): ExamEntry[] {
  const monthOf = new Map(months.map((tab) => [tab.sheet, tab.month]));
  const best = new Map<string, ExamEntry>();
  const passthrough: ExamEntry[] = [];
  for (const entry of entries) {
    if (!entry.date || !entry.start) {
      passthrough.push(entry);
      continue;
    }
    const key = `${entry.date}|${entry.start}|${entry.code ?? entry.title.toLowerCase()}`;
    const current = best.get(key);
    const ownMonth = monthOf.get(entry.sheet) === entry.date.slice(0, 7);
    if (!current || (ownMonth && monthOf.get(current.sheet) !== current.date!.slice(0, 7))) best.set(key, entry);
  }
  return [...best.values(), ...passthrough];
}

function splitRemark(raw: string): { title: string; remark: string | null } {
  const remarks = [...raw.matchAll(/\*{2,}\s*([^*]+?)\s*\*{2,}/g)].map((match) => cleanText(match[1]!));
  const title = cleanText(raw.replace(/\*{2,}[^*]*\*{2,}/g, " ").replace(/\*{2,}.*$/s, " "));
  const trailing = /\*{2,}\s*([^*]+)$/.exec(raw)?.[1];
  if (trailing && !remarks.length) remarks.push(cleanText(trailing));
  return { title: title || cleanText(raw), remark: remarks.length ? remarks.join(" · ") : null };
}

function dateOf(value: CellValue): string | null {
  if (value instanceof Date) return isoFromSheetDate(value);
  return value === null ? null : parseLooseDate(String(value));
}

function numberOf(value: CellValue): number | null {
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function codeOf(value: CellValue): string | null {
  if (value === null || value === "") return null;
  if (typeof value === "number") return String(Math.round(value));
  return cleanText(String(value)) || null;
}

function booleanOf(value: CellValue): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (/^(true|yes|✓|✔)$/i.test(value.trim())) return true;
    if (/^(false|no)$/i.test(value.trim())) return false;
  }
  return null;
}

/** "DT01\nDT03" → two rooms, but "Conference \nroom 1 (401)" is one room wrapped onto a second line. */
export function splitRooms(raw: string): string[] {
  const rooms: string[] = [];
  for (const line of raw.split(/\n|,|;/).map((part) => cleanText(part)).filter(Boolean)) {
    if (rooms.length > 0 && /^[a-z(]/.test(line)) rooms[rooms.length - 1] = `${rooms[rooms.length - 1]} ${line}`;
    else rooms.push(line);
  }
  return rooms;
}

const KNOWN = new Map(INVIGILATORS.map((person) => [person.nickname.toLowerCase(), person.nickname]));
const ALIASES = new Map([["moss", "Mors"]]);

/** "P'Moss/Bank\nKo/Earth" → ["Mors","Bank","Ko","Earth"]; unknown names are kept as written. */
export function splitInvigilators(raw: string): string[] {
  const names = raw
    .split(/[/\n,]+/)
    .map((part) => normalizeInvigilator(part))
    .filter((name): name is string => Boolean(name));
  return [...new Set(names)];
}

export function normalizeInvigilator(raw: string): string | null {
  const cleaned = cleanText(raw)
    .replace(/^p\s*['’]\s*/i, "")
    .replace(/\d+$/, "")
    .trim();
  if (!cleaned) return null;
  const lower = cleaned.toLowerCase();
  return KNOWN.get(lower) ?? ALIASES.get(lower) ?? cleaned;
}

function parseSummaryTab(grid: Grid): HoursSummary | null {
  let headerRow = 0;
  for (let row = 1; row <= Math.min(grid.rowCount, 10); row++) {
    if (textAt(grid, row, 1) === "ลำดับ") {
      headerRow = row;
      break;
    }
  }
  if (!headerRow) return null;
  const dateRow = headerRow + 1;
  const columns: SummaryColumn[] = [];
  const columnIndex = new Map<number, number>();
  let totalCol = 0;
  for (let col = 3; col <= grid.columnCount; col++) {
    const dateText = textAt(grid, dateRow, col);
    if (/ชั่วโมงรวม/.test(dateText)) {
      totalCol = col;
      break;
    }
    const date = dateOf(getCell(grid, dateRow, col)?.value ?? null);
    const title = cleanText(textAt(grid, dateRow + 2, col));
    if (!date && !title) continue;
    const time = parseTimeRange(textAt(grid, dateRow + 1, col));
    columnIndex.set(col, columns.length);
    columns.push({
      ref: cellRef(dateRow, col),
      date,
      start: time?.start ?? null,
      end: time?.end ?? null,
      title,
      hours: numberOf(getCell(grid, dateRow + 3, col)?.value ?? null) ?? 0,
    });
  }

  const people: SummaryPerson[] = [];
  const warnings: Bi[] = [];
  for (let row = dateRow + 4; row <= grid.rowCount; row++) {
    const name = textAt(grid, row, 2);
    if (!name || /^total$/i.test(name)) break;
    const person = normalizeInvigilator(name) ?? name;
    const assignments: number[] = [];
    for (const [col, index] of columnIndex) {
      const mark = textAt(grid, row, col);
      if (!mark) continue;
      assignments.push(index);
      const marked = normalizeInvigilator(mark);
      if (marked && marked !== person) {
        warnings.push({
          th: `แถวของ ${person} ช่อง ${cellRef(row, col)} เขียนว่า "${mark}" — ระบบนับชั่วโมงให้ ${person} ตามสูตรในชีต`,
          en: `${person}'s row, cell ${cellRef(row, col)}, says "${mark}" — the hours are counted for ${person}, following the sheet's formula`,
        });
      }
    }
    assignments.sort((a, b) => a - b);
    const summed = Math.round(assignments.reduce((sum, index) => sum + (columns[index]?.hours ?? 0), 0) * 100) / 100;
    const sheetTotal = totalCol ? numberOf(getCell(grid, row, totalCol)?.value ?? null) : null;
    const hours = sheetTotal === null ? summed : Math.round(sheetTotal * 100) / 100;
    if (sheetTotal !== null && Math.abs(hours - summed) > 0.01) {
      warnings.push({
        th: `ชั่วโมงรวมของ ${person} ในชีต (${hours}) ไม่เท่ากับผลรวมช่องที่ลงชื่อ (${summed}) — ตรวจช่วงสูตรในคอลัมน์ ${cellRef(row, totalCol)}`,
        en: `${person}'s total in the sheet (${hours}) does not match the sum of the marked cells (${summed}) — check the formula range in ${cellRef(row, totalCol)}`,
      });
    }
    people.push({ name: person, hours, assignments });
  }

  return { sheet: grid.name, columns, people, warnings };
}
