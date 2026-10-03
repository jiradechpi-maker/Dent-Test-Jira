import { describe, expect, it } from "vitest";
import { invigilationGrids } from "./test-fixtures";
import { monthOfTab, parseInvigilationWorkbook, splitInvigilators, splitRooms } from "./invigilation";
import { invigilatorLoads, missingFromSummary, sameCourse } from "./load";
import { setCell } from "@/lib/sheets/grid";

describe("monthly invigilation tabs", () => {
  const book = parseInvigilationWorkbook(invigilationGrids());
  const at = (row: number) => book.entries.find((entry) => entry.row === row)!;

  it("maps tab names to months and skips hidden tabs", () => {
    expect(monthOfTab("กรรมการคุมสอบเดือนตุลาคม 69")).toBe("2026-10");
    expect(book.months).toEqual([{ sheet: "กรรมการคุมสอบเดือนตุลาคม 69", month: "2026-10" }]);
  });

  it("reads each row with both Finished columns told apart", () => {
    expect(at(3)).toMatchObject({
      date: "2026-10-08",
      start: "09:00",
      end: "11:00",
      code: "20626214",
      year: 2,
      submitBy: "2026-10-01",
      paperReceived: true,
      done: false,
      rooms: ["DT01", "DT03"],
      invigilators: ["Mors", "Nurse"],
    });
  });

  it("separates *** remarks *** from the course title", () => {
    expect(at(4)).toMatchObject({ title: "Preventive Dentistry (Final Exam)", remark: "หาวันลงอยู่", postponed: true });
  });

  it("fills a second session row from the merged cells above it", () => {
    expect(at(10)).toMatchObject({ date: "2026-10-28", start: "13:00", code: "20636314", rooms: ["Common Lab"], invigilators: ["Namtan", "Nurse"] });
  });

  it("keeps rows that have no date yet", () => {
    expect(at(11)).toMatchObject({ date: null, postponed: true, remark: "เลื่อน" });
  });
});

describe("splitting cells", () => {
  it("rejoins a room name wrapped onto two lines", () => {
    expect(splitRooms("Conference \nroom 1 (401)")).toEqual(["Conference room 1 (401)"]);
    expect(splitRooms("Lecture 1\nLecture 3")).toEqual(["Lecture 1", "Lecture 3"]);
  });
  it("normalises nicknames", () => {
    expect(splitInvigilators("P'Moss/Bank\nKo/Earth")).toEqual(["Mors", "Bank", "Ko", "Earth"]);
    expect(splitInvigilators("/Bank")).toEqual(["Bank"]);
  });
});

describe("hours summary", () => {
  const book = parseInvigilationWorkbook(invigilationGrids());

  it("counts hours by row like the sheet's SUMIF and flags a name written in someone else's row", () => {
    expect(book.summary?.people).toEqual([
      { name: "Mors", hours: 2, assignments: [0] },
      { name: "Nurse", hours: 4, assignments: [0, 1] },
    ]);
    expect(book.summary?.warnings).toHaveLength(1);
    expect(book.summary?.warnings[0]).toContain("Pim");
  });

  it("adds assignments the summary tab has not picked up yet", () => {
    const loads = invigilatorLoads(book, "2026-10-01");
    const nurse = loads.find((load) => load.name === "Nurse")!;
    // 08-10 is already in the summary; 09-10 is postponed; the two CD lab sessions (3 + 3 h) are new.
    expect(nurse).toMatchObject({ recorded: 4, planned: 6, total: 10 });
    expect(loads[0]!.total).toBeLessThanOrEqual(loads.at(-1)!.total);
  });

  it("uses the sheet's own total column when it has one", () => {
    const grids = invigilationGrids();
    setCell(grids[0]!, 7, 5, 4);
    setCell(grids[0]!, 6, 5, 3);
    const people = parseInvigilationWorkbook(grids).summary!.people;
    expect(people.find((p) => p.name === "Nurse")!.hours).toBe(4);
    expect(people.find((p) => p.name === "Mors")!.hours).toBe(3);
    expect(parseInvigilationWorkbook(grids).summary!.warnings.some((w) => w.includes("Mors") && w.includes("(3)"))).toBe(true);
  });

  it("does not count an exam twice when the summary tab lists it at a different time", () => {
    const grids = invigilationGrids();
    // The summary says 13:00 for the cardio midterm; the month tab says 09:00.
    setCell(grids[0]!, 3, 3, "13.00-15.00");
    const loads = invigilatorLoads(parseInvigilationWorkbook(grids), "2026-10-01");
    expect(loads.find((load) => load.name === "Mors")).toMatchObject({ recorded: 2, planned: 0, total: 2 });
  });

  it("lists past exams the summary tab never counted, apart from upcoming ones", () => {
    const loads = invigilatorLoads(book, "2026-10-27");
    const earth = loads.find((load) => load.name === "Earth")!;
    expect(earth).toMatchObject({ recorded: 0, planned: 0, unrecorded: 5 });
    expect(missingFromSummary(loads).map((item) => item.entry.row)).toEqual([5, 6, 7, 8]);
  });
});

describe("matching course titles across tabs", () => {
  it("ignores exam labels, case and small words", () => {
    expect(sameCourse("Clinical anatomy \nin dentistry (Final) ", "Clinical Anatomy in Dentistry")).toBe(true);
    expect(sameCourse("General Microbiology for Dental Science (Midterm)", "General Microbiology for Dental Science ")).toBe(true);
    expect(sameCourse("Dental Anatomy (Midterm)", "Dental Biomaterials (Final Exam)")).toBe(false);
  });
});
