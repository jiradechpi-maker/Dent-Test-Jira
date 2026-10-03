import { describe, expect, it } from "vitest";
import { FIVE_MINUTE_TEXT, announcementText, captionFor } from "./announcements";

describe("5-minute warning", () => {
  it("uses the faculty's wording by default", () => {
    expect(FIVE_MINUTE_TEXT).toBe("เหลือเวลาสอบอีก 5 นาที กรุณาตรวจสอบความถูกต้อง และอย่าลืมเขียนชื่อและเลขที่ ID");
    expect(announcementText("   ")).toBe(FIVE_MINUTE_TEXT);
    expect(announcementText(" , . ")).toBe(FIVE_MINUTE_TEXT);
    expect(announcementText(" เหลือ 5 นาที ")).toBe("เหลือ 5 นาที");
  });

  it("shows English on screen only while the standard wording is used", () => {
    expect(captionFor(FIVE_MINUTE_TEXT).en).toContain("5 minutes remaining");
    expect(captionFor("")).toEqual(captionFor(FIVE_MINUTE_TEXT));
    expect(captionFor("เหลือ 5 นาที")).toEqual({ th: "เหลือ 5 นาที", en: "" });
  });
});
