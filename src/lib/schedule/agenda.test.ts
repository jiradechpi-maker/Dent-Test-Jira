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
    expect(items[0]?.title.th).toMatch(/^เตรียมสอบ พฤ\. 8 ต\.ค\. \(\d+ วิชา\) — แจ้งกรรมการและเตรียมซองข้อสอบ$/);
    expect(items[0]?.title.en).toMatch(/^Exam prep for Thu 8 Oct \(\d+ courses?\) — notify invigilators and prepare exam envelopes$/);
    const onDay = todayAgenda(book, null, "2026-10-08");
    const today = onDay.find((item) => item.id.startsWith("today:"));
    expect(today?.title.th).toContain("Basic Cardiovascular");
    expect(today?.title.th).toMatch(/^สอบวันนี้ \d{2}\.\d{2}/);
    expect(today?.title.en).toMatch(/^Exam today \d{2}:\d{2}.* · Basic Cardiovascular/);
    expect(today?.detail.th).toMatch(/^ห้อง .+ · กรรมการ /);
    expect(today?.detail.en).toMatch(/^Rooms?: .+ · Invigilators?: /);
  });

  it("flags an exam paper that is overdue", () => {
    const entries = book.entries.map((entry) => (entry.row === 3 ? { ...entry, paperReceived: false } : entry));
    const items = todayAgenda({ ...book, entries }, null, "2026-10-02");
    expect(items[0]).toMatchObject({ tone: "danger" });
    expect(items[0]?.title.th).toContain("เลยกำหนดส่งข้อสอบ");
    expect(items[0]?.title.en).toContain("Exam paper overdue");
    expect(items[0]?.detail.en).not.toMatch(/[\u0e00-\u0e7f]/);
  });

  it("says plainly when an exam has no room or invigilators yet", () => {
    const entries = book.entries.map((entry) => (entry.date === "2026-10-08" ? { ...entry, rooms: [], invigilators: [] } : entry));
    const [today] = todayAgenda({ ...book, entries }, null, "2026-10-08").filter((item) => item.id.startsWith("today:"));
    expect(today).toMatchObject({ tone: "danger" });
    expect(today?.detail).toEqual({ th: "ห้อง ยังไม่มีห้อง · กรรมการ ยังไม่มีกรรมการ", en: "Room: not assigned · Invigilators: not assigned" });
    const [next] = todayAgenda({ ...book, entries }, null, "2026-10-07");
    expect(next?.tone).toBe("warning");
    expect(next?.detail.en).toContain("no room yet · no invigilators yet");
  });

  it("keeps a missing exam time readable in both languages", () => {
    const entries = book.entries.map((entry) => (entry.date === "2026-10-08" ? { ...entry, start: null, end: null } : entry));
    const [today] = todayAgenda({ ...book, entries }, null, "2026-10-08").filter((item) => item.id.startsWith("today:"));
    expect(today?.title.th).toMatch(/^สอบวันนี้ ไม่ระบุเวลา · /);
    expect(today?.title.en).toMatch(/^Exam today \(time TBC\) · /);
  });
});
