import { describe, expect, it } from "vitest";
import { RULE_PRESETS, describeRules, roomNotices, rulesFor } from "./room-rules";
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

describe("rule presets", () => {
  it("all close late entry 30 minutes in and differ on leaving", () => {
    for (const preset of RULE_PRESETS.filter((p) => p.id !== "none")) expect(preset.rules.lateEntryMinutes).toBe(30);
    expect(rulesFor("international", { lateEntryMinutes: 1, earlyLeaveMinutes: 1, lastLeaveMinutes: 1 })).toEqual({
      lateEntryMinutes: 30,
      earlyLeaveMinutes: 60,
      lastLeaveMinutes: 15,
    });
    expect(rulesFor("custom", { lateEntryMinutes: 15, earlyLeaveMinutes: 30, lastLeaveMinutes: 10 }).lateEntryMinutes).toBe(15);
  });

  it("summarises a rule set in one line", () => {
    expect(describeRules({ lateEntryMinutes: 30, earlyLeaveMinutes: 60, lastLeaveMinutes: 15 })).toEqual({
      th: "เข้าห้องได้ภายใน 30 นาทีแรก · ออกได้หลัง 60 นาที · งดออก 15 นาทีสุดท้าย",
      en: "Late entry up to 30 min · leave after 60 min · no leaving in the final 15 min",
    });
    expect(describeRules({ lateEntryMinutes: 0, earlyLeaveMinutes: 0, lastLeaveMinutes: 0 }).th).toBe("ไม่แสดงกติกาบนจอ");
  });
});

describe("door notices on the projector", () => {
  const rules = { lateEntryMinutes: 30, earlyLeaveMinutes: 45, lastLeaveMinutes: 15 };
  const s = session("09:00", "12:00");
  const texts = (time: string) => roomNotices(s, at(time), rules).map((n) => `${n.state}:${n.text.th}`);

  it("words the rules for the moment", () => {
    expect(texts("08:55:00")).toEqual([
      "info:เข้าห้องสอบได้ถึง 09:30 น.",
      "info:ออกจากห้องสอบได้ตั้งแต่ 09:45 น.",
      "info:งดออกจากห้อง 15 นาทีสุดท้าย",
    ]);
    expect(texts("09:10:00")).toEqual(["open:เข้าห้องสอบได้ถึง 09:30 น.", "closed:ยังออกจากห้องสอบไม่ได้ จนถึง 09:45 น."]);
    expect(texts("10:00:00")).toEqual(["closed:ปิดรับเข้าห้องสอบแล้ว (09:30 น.)", "open:ออกจากห้องสอบได้แล้ว"]);
    expect(texts("11:50:00")).toEqual(["closed:ปิดรับเข้าห้องสอบแล้ว (09:30 น.)", "closed:15 นาทีสุดท้าย — กรุณานั่งรอจนหมดเวลา"]);
    expect(texts("12:00:00")).toEqual([]);
    expect(roomNotices(s, at("10:00:00"), rules).map((n) => n.text.en)).toEqual(["Entry closed (09:30)", "You may now leave"]);
  });

  it("shows nothing for rules that are off or don't fit a short exam", () => {
    expect(roomNotices(s, at("09:10:00"), { lateEntryMinutes: 0, earlyLeaveMinutes: 0, lastLeaveMinutes: 0 })).toEqual([]);
    const short = session("09:00", "09:40");
    // In a 40-minute quiz, "leave after 45 min" never comes; the final-15 window starts at 09:25.
    expect(roomNotices(short, at("09:05:00"), rules).map((n) => n.key)).toEqual(["entry"]);
    expect(roomNotices(short, at("09:31:00"), rules).map((n) => n.key)).toEqual(["entry", "last"]);
  });
});
