import { describe, expect, it } from "vitest";
import { invigilationGrids } from "./test-fixtures";
import { monthOfTab, parseInvigilationWorkbook, splitInvigilators, splitRooms } from "./invigilation";
import { invigilatorLoads } from "./load";

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
    const loads = invigilatorLoads(book);
    const nurse = loads.find((load) => load.name === "Nurse")!;
    // 08-10 is already in the summary; 09-10 is postponed; the two CD lab sessions (3 + 3 h) are new.
    expect(nurse).toMatchObject({ recorded: 4, planned: 6, total: 10 });
    expect(loads[0]!.total).toBeLessThanOrEqual(loads.at(-1)!.total);
  });
});
