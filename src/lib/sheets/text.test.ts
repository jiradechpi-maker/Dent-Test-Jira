import { describe, expect, it } from "vitest";
import { parseLooseDate, parseTimeRange, rangesOverlap } from "./text";

describe("parseLooseDate", () => {
  it("reads Buddhist-era short years used in the invigilation tabs", () => {
    expect(parseLooseDate("Thu. 08-10-69")).toBe("2026-10-08");
    expect(parseLooseDate("Tue. 9-6-69 ")).toBe("2026-06-09");
    expect(parseLooseDate("Wed. 15-07-69")).toBe("2026-07-15");
  });
  it("reads Christian-era years", () => {
    expect(parseLooseDate("27/10/2026")).toBe("2026-10-27");
    expect(parseLooseDate("ย้ายมาจาก 21/10/26")).toBe("2026-10-21");
    expect(parseLooseDate("Thu., 08-10-2026")).toBe("2026-10-08");
  });
  it("rejects impossible dates", () => {
    expect(parseLooseDate("31-02-69")).toBeNull();
    expect(parseLooseDate("ไม่มีวันที่")).toBeNull();
  });
});

describe("parseTimeRange", () => {
  it("normalises the sheet's time formats", () => {
    expect(parseTimeRange("(9.00-12.00)")).toEqual({ start: "09:00", end: "12:00" });
    expect(parseTimeRange("10.00-11.40")).toEqual({ start: "10:00", end: "11:40" });
    expect(parseTimeRange("13:00 - 16:00")).toEqual({ start: "13:00", end: "16:00" });
    expect(parseTimeRange("12.00-09.00")).toBeNull();
  });
  it("detects overlaps but not touching ranges", () => {
    expect(rangesOverlap({ start: "09:00", end: "11:00" }, { start: "10:00", end: "12:00" })).toBe(true);
    expect(rangesOverlap({ start: "09:00", end: "10:00" }, { start: "10:00", end: "12:00" })).toBe(false);
  });
});
