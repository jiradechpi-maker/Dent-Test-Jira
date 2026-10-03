import { describe, expect, it } from "vitest";
import { REGULATION_RULES, describeRules, isRegulation, normalizeRules, roomNotices, type RoomRules } from "./room-rules";
import { createSession } from "./timing";

const at = (hhmmss: string) => {
  const [h = 0, m = 0, s = 0] = hhmmss.split(":").map(Number);
  return new Date(2026, 9, 3, h, m, s).getTime();
};

function session(start: string, end: string) {
  const result = createSession(at("08:00:00"), { startTime: start, endTime: end });
  if (!result.ok) throw new Error("expected ok");
  return result.session;
}

const texts = (s: ReturnType<typeof session>, time: string, rules: RoomRules) => roomNotices(s, at(time), rules).map((n) => `${n.state}:${n.text.th}`);

describe("room rule choices", () => {
  it("defaults to the institute regulation: 30 minutes late at most, nobody leaves in the first hour", () => {
    expect(REGULATION_RULES).toEqual({ lateEntryMinutes: 30, earlyLeaveMinutes: 60 });
    expect(normalizeRules(undefined)).toEqual(REGULATION_RULES);
    expect(isRegulation(REGULATION_RULES)).toBe(true);
  });

  it("keeps the offered choices and drops anything else (including rules saved by older versions)", () => {
    expect(normalizeRules({ lateEntryMinutes: 0, earlyLeaveMinutes: 30 })).toEqual({ lateEntryMinutes: 0, earlyLeaveMinutes: 30 });
    expect(normalizeRules({ lateEntryMinutes: 15, earlyLeaveMinutes: 60 })).toEqual({ lateEntryMinutes: 15, earlyLeaveMinutes: 60 });
    expect(normalizeRules({ lateEntryMinutes: 45, earlyLeaveMinutes: 45, lastLeaveMinutes: 15 })).toEqual(REGULATION_RULES);
    expect(normalizeRules("custom")).toEqual(REGULATION_RULES);
  });

  it("summarises the rules in one line", () => {
    expect(describeRules(REGULATION_RULES)).toEqual({
      th: "เข้าห้องสอบสายได้ไม่เกิน 30 นาที · ออกจากห้องสอบได้เมื่อสอบไปแล้ว 1 ชั่วโมง",
      en: "Late entry up to 30 minutes · you may leave after 1 hour",
    });
    expect(describeRules({ lateEntryMinutes: 0, earlyLeaveMinutes: 30 })).toEqual({
      th: "ไม่อนุญาตให้เข้าห้องสอบสาย · ออกจากห้องสอบได้เมื่อสอบไปแล้ว 30 นาที",
      en: "No late entry · you may leave after 30 minutes",
    });
  });
});

describe("door notices on the projector", () => {
  const s = session("09:00", "12:00");

  it("words the regulation for the moment", () => {
    expect(texts(s, "08:55:00", REGULATION_RULES)).toEqual(["info:เข้าห้องสอบได้ถึง 09:30 น.", "info:ออกจากห้องสอบได้ตั้งแต่ 10:00 น."]);
    expect(texts(s, "09:10:00", REGULATION_RULES)).toEqual(["open:เข้าห้องสอบได้ถึง 09:30 น.", "closed:ยังออกจากห้องสอบไม่ได้ จนถึง 10:00 น."]);
    expect(texts(s, "10:30:00", REGULATION_RULES)).toEqual(["closed:ปิดรับเข้าห้องสอบแล้ว (09:30 น.)", "open:ออกจากห้องสอบได้แล้ว"]);
    expect(texts(s, "12:00:00", REGULATION_RULES)).toEqual([]);
    expect(roomNotices(s, at("10:30:00"), REGULATION_RULES).map((n) => n.text.en)).toEqual(["Entry closed (09:30)", "You may now leave"]);
  });

  it("says when nobody may come in late", () => {
    const strict = { lateEntryMinutes: 0, earlyLeaveMinutes: 30 };
    expect(texts(s, "08:55:00", strict)).toEqual(["info:เข้าห้องสอบก่อน 09:00 น. · ไม่อนุญาตให้เข้าสาย", "info:ออกจากห้องสอบได้ตั้งแต่ 09:30 น."]);
    expect(texts(s, "09:01:00", strict)).toEqual(["closed:ปิดรับเข้าห้องสอบแล้ว (09:00 น.)", "closed:ยังออกจากห้องสอบไม่ได้ จนถึง 09:30 น."]);
    expect(texts(s, "09:20:00", { lateEntryMinutes: 15, earlyLeaveMinutes: 30 })[0]).toBe("closed:ปิดรับเข้าห้องสอบแล้ว (09:15 น.)");
  });

  it("says plainly when an exam is too short to leave early", () => {
    // 1 hour under the regulation (leave after 1 hour): there is no time to leave.
    const hour = session("09:00", "10:00");
    expect(texts(hour, "08:50:00", REGULATION_RULES)).toEqual(["info:เข้าห้องสอบได้ถึง 09:30 น.", "info:ออกจากห้องสอบไม่ได้จนหมดเวลาสอบ"]);
    expect(texts(hour, "09:40:00", REGULATION_RULES)).toEqual(["closed:ปิดรับเข้าห้องสอบแล้ว (09:30 น.)", "closed:ออกจากห้องสอบไม่ได้จนหมดเวลาสอบ"]);
  });

  it("keeps counting from the start when time is added", () => {
    // 1 hour, then +10 minutes: leaving is allowed again from 10:00, as the regulation says.
    const hour = session("09:00", "10:00");
    const extended = { ...hour, endAt: hour.endAt + 10 * 60_000 };
    expect(texts(extended, "09:50:00", REGULATION_RULES)[1]).toBe("closed:ยังออกจากห้องสอบไม่ได้ จนถึง 10:00 น.");
    expect(texts(extended, "10:05:00", REGULATION_RULES)[1]).toBe("open:ออกจากห้องสอบได้แล้ว");
    // A 25-minute quiz shows no late-entry line (the whole quiz is inside the 30 minutes).
    expect(roomNotices(session("09:00", "09:25"), at("09:10:00"), REGULATION_RULES).map((n) => n.key)).toEqual(["leave"]);
  });
});
