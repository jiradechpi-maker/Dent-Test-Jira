/**
 * Run the spreadsheet parsers against local .xlsx files and print what the app would show.
 *   npx tsx scripts/inspect-sheets.mts --teaching ปี4.xlsx --invigilation คุมสอบ.xlsx
 */
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { readWorkbook } from "../src/server/sheets/read-workbook";
import { pickTeachingSheet } from "../src/lib/schedule/sources";
import { parseTeachingSchedule } from "../src/lib/schedule/teaching";

const { values } = parseArgs({ options: { teaching: { type: "string" }, invigilation: { type: "string" }, verbose: { type: "boolean" } } });

if (values.teaching) {
  const grids = await readWorkbook(readFileSync(values.teaching));
  const grid = pickTeachingSheet(grids);
  const schedule = parseTeachingSchedule(grid);
  console.log(`# ${schedule.title} — sheet "${schedule.sheetName}"`);
  console.log(`sessions: ${schedule.sessions.length} · off-grid notes: ${schedule.notes.length} · courses: ${schedule.courses.length}`);
  const byKind = new Map<string, number>();
  for (const s of schedule.sessions) byKind.set(s.kind, (byKind.get(s.kind) ?? 0) + 1);
  console.log("by kind:", Object.fromEntries(byKind));
  const byCourse = new Map<string, number>();
  for (const s of schedule.sessions) byCourse.set(s.course ?? "(none)", (byCourse.get(s.course ?? "(none)") ?? 0) + 1);
  console.log("by course:", Object.fromEntries(byCourse));
  if (values.verbose) {
    for (const s of schedule.sessions) console.log(s.id.padEnd(6), s.date, s.start, s.end, s.kind.padEnd(8), (s.course ?? "-").slice(0, 24).padEnd(24), s.title.slice(0, 70), s.instructors.join(","));
  }
  for (const n of schedule.notes) console.log("NOTE", n.id, n.date, n.text.slice(0, 80));
}

if (values.invigilation) {
  const { parseInvigilationWorkbook } = await import("../src/lib/schedule/invigilation");
  const grids = await readWorkbook(readFileSync(values.invigilation));
  const book = parseInvigilationWorkbook(grids);
  console.log(JSON.stringify(book, null, values.verbose ? 2 : 0).slice(0, values.verbose ? Infinity : 3000));
}

if (values.teaching && values.invigilation) {
  const { crossCheckYear, findExamClashes, findIncompleteExams, sortIssues } = await import("../src/lib/schedule/checks");
  const { parseInvigilationWorkbook } = await import("../src/lib/schedule/invigilation");
  const teaching = parseTeachingSchedule(pickTeachingSheet(await readWorkbook(readFileSync(values.teaching))));
  const book = parseInvigilationWorkbook(await readWorkbook(readFileSync(values.invigilation)));
  const issues = sortIssues([...findExamClashes(book.entries), ...findIncompleteExams(book.entries, "2026-10-02"), ...crossCheckYear(book, teaching, 4)]);
  for (const issue of issues) console.log(issue.severity.padEnd(7), issue.kind.padEnd(20), issue.date, "|", issue.title, "|", issue.detail);
}
