import { describe, expect, it } from "vitest";
import { crossCheckYear, findExamClashes, findIncompleteExams } from "./checks";
import { invigilationGrids } from "./test-fixtures";
import { parseInvigilationWorkbook } from "./invigilation";
import type { TeachingSchedule, TeachingSession } from "./teaching";

const book = parseInvigilationWorkbook(invigilationGrids());

function session(partial: Partial<TeachingSession> & Pick<TeachingSession, "id" | "date" | "title">): TeachingSession {
  return {
    start: "10:00",
    end: "12:00",
    instructors: [],
    course: null,
    color: null,
    kind: "exam",
    group: null,
    movedFrom: null,
    week: null,
    semester: 1,
    ...partial,
  };
}

describe("findExamClashes", () => {
  const issues = findExamClashes(book.entries);

  it("flags two different exams in one room at overlapping times", () => {
    const clash = issues.find((issue) => issue.kind === "room-clash");
    expect(clash).toMatchObject({ date: "2026-10-26", severity: "danger" });
  });

  it("flags an invigilator booked twice", () => {
    expect(issues.find((issue) => issue.kind === "invigilator-clash")?.title).toContain("Earth");
  });

  it("treats same room + same time + same invigilators as one combined sitting", () => {
    expect(issues.find((issue) => issue.date === "2026-10-21")).toMatchObject({ kind: "shared-room", severity: "info" });
  });
});

describe("findIncompleteExams", () => {
  it("lists upcoming exams still missing a date", () => {
    const issues = findIncompleteExams(book.entries, "2026-10-01");
    expect(issues.filter((issue) => issue.kind === "missing-date")).toHaveLength(2);
  });
});

describe("crossCheckYear", () => {
  const teaching: TeachingSchedule = {
    sheetName: "ปี 4",
    title: null,
    notes: [],
    courses: [],
    sessions: [
      session({ id: "H190", date: "2026-11-05", title: "Final Examination: Pediatric Dentistry (ย้ายมาจาก 21/10/26)", movedFrom: "2026-10-21" }),
      session({ id: "F179", date: "2026-10-26", title: "Exam", start: "09:00" }),
      session({ id: "F155", date: "2026-10-30", title: "Midterm exam Orthodontics" }),
    ],
  };
  const issues = crossCheckYear(book, teaching, 4);

  it("spots an exam the teaching schedule moved to another day", () => {
    expect(issues.find((issue) => issue.kind === "date-mismatch")).toMatchObject({
      severity: "danger",
      examIds: ["กรรมการคุมสอบเดือนตุลาคม 69!5"],
      sessionIds: ["H190"],
    });
  });

  it("matches a same-day exam even when the teaching title is just 'Exam'", () => {
    expect(issues.some((issue) => issue.sessionIds.includes("F179"))).toBe(false);
  });

  it("lists teaching-schedule exams with no invigilation row in a covered month", () => {
    expect(issues.find((issue) => issue.kind === "not-in-invigilation")?.sessionIds).toEqual(["F155"]);
  });
});
