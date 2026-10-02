import { describe, expect, it } from "vitest";
import {
  digits,
  formatFullThaiDate,
  formatHours,
  formatLetterDate,
  formatScheduleDay,
  formatTimeRange,
  hoursBetween,
  parseIsoDate,
  toArabicDigits,
  toThaiDigits,
  todayInBangkok,
} from "./thai";

describe("Thai digits", () => {
  it("converts both ways", () => {
    expect(toThaiDigits("อว 7033 / 311")).toBe("อว ๗๐๓๓ / ๓๑๑");
    expect(toArabicDigits("๐๘๙-๖๑๙๑-๓๒๙")).toBe("089-6191-329");
  });

  it("keeps digits that belong to Latin codes (room DT01)", () => {
    expect(digits("ห้อง DT01 ชั้น 8", true)).toBe("ห้อง DT01 ชั้น ๘");
    expect(digits("ห้อง DT01 ชั้น 8", false)).toBe("ห้อง DT01 ชั้น 8");
  });
});

describe("dates", () => {
  it("rejects impossible dates", () => {
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(parseIsoDate("2026-13-01")).toBeNull();
    expect(parseIsoDate("29/09/2026")).toBeNull();
    expect(parseIsoDate("2026-09-29")).toEqual({ year: 2026, month: 9, day: 29 });
  });

  it("formats exactly like the original letter", () => {
    expect(formatScheduleDay("2026-09-29")).toBe("อังคารที่ ๒๙/๐๙/๖๙");
    expect(formatScheduleDay("2026-09-30")).toBe("พุธที่ ๓๐/๐๙/๖๙");
    expect(formatFullThaiDate("2026-10-19")).toBe("วันจันทร์ที่ ๑๙ ตุลาคม ๒๕๖๙");
    expect(formatLetterDate("2026-08-01", { includeDay: false })).toBe("สิงหาคม ๒๕๖๙");
    expect(formatLetterDate("2026-09-06", { includeDay: true })).toBe("๖ กันยายน ๒๕๖๙");
  });

  it("returns Bangkok's calendar date regardless of server timezone", () => {
    // 2026-10-01 18:30 UTC is already 2 October in Bangkok (UTC+7).
    expect(todayInBangkok(new Date("2026-10-01T18:30:00Z"))).toBe("2026-10-02");
  });
});

describe("times", () => {
  it("formats ranges", () => {
    expect(formatTimeRange("13:00", "16:00")).toBe("๑๓.๐๐ - ๑๖.๐๐ น.");
    expect(formatTimeRange("09:00", "12:00", false)).toBe("09.00 - 12.00 น.");
    expect(() => formatTimeRange("25:00", "26:00")).toThrow();
  });

  it("computes hours", () => {
    expect(hoursBetween("09:00", "12:00")).toBe(3);
    expect(hoursBetween("13:00", "14:30")).toBe(1.5);
    expect(hoursBetween("12:00", "09:00")).toBe(0);
    expect(formatHours(1.5)).toBe("๑.๕");
    expect(formatHours(3, false)).toBe("3");
  });
});
