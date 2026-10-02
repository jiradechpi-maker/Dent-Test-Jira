import { describe, expect, it } from "vitest";
import { nextWorkingDay, todayAgenda } from "./agenda";
import { invigilationGrids } from "./test-fixtures";
import { parseInvigilationWorkbook } from "./invigilation";

describe("nextWorkingDay", () => {
  it("skips the weekend", () => {
    expect(nextWorkingDay("2026-10-02")).toBe("2026-10-05"); // Fri → Mon
    expect(nextWorkingDay("2026-10-03")).toBe("2026-10-05"); // Sat → Mon
    expect(nextWorkingDay("2026-10-06")).toBe("2026-10-07");
  });
});

describe("todayAgenda", () => {
  const book = parseInvigilationWorkbook(invigilationGrids());

  it("lists today's exams, the next working day's exams and exam papers to chase", () => {
    const items = todayAgenda(book, null, "2026-10-07");
    expect(items.map((item) => item.id)).toEqual([
      // paper for the 08-10 exam was already received, so nothing to chase for it
      "next:2026-10-08",
    ]);
    const onDay = todayAgenda(book, null, "2026-10-08");
    expect(onDay.find((item) => item.id.startsWith("today:"))?.title).toContain("Basic Cardiovascular");
  });

  it("flags an exam paper that is overdue", () => {
    const entries = book.entries.map((entry) => (entry.row === 3 ? { ...entry, paperReceived: false } : entry));
    const items = todayAgenda({ ...book, entries }, null, "2026-10-02");
    expect(items[0]).toMatchObject({ tone: "danger" });
    expect(items[0]?.title).toContain("เลยกำหนดส่งข้อสอบ");
  });
});
