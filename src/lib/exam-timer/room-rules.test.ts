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

  it("shows nothing for rules that are off", () => {
    expect(roomNotices(s, at("09:10:00"), { lateEntryMinutes: 0, earlyLeaveMinutes: 0, lastLeaveMinutes: 0 })).toEqual([]);
  });

  it("says plainly when an exam is too short to leave early", () => {
    // 40-minute quiz, "leave after 45 min": nobody may leave; "final 15" adds nothing.
    const quiz = session("09:00", "09:40");
    expect(texts2(quiz, "09:05:00", rules)).toEqual(["open:เข้าห้องสอบได้ถึง 09:30 น.", "closed:ออกจากห้องสอบไม่ได้จนหมดเวลาสอบ"]);
    expect(texts2(quiz, "09:31:00", rules)).toEqual(["closed:ปิดรับเข้าห้องสอบแล้ว (09:30 น.)", "closed:ออกจากห้องสอบไม่ได้จนหมดเวลาสอบ"]);
    // 70 minutes with the IB preset (leave after 60, none in the final 15): no window either.
    const ib = { lateEntryMinutes: 30, earlyLeaveMinutes: 60, lastLeaveMinutes: 15 };
    expect(texts2(session("09:00", "10:10"), "08:50:00", ib)).toEqual(["info:เข้าห้องสอบได้ถึง 09:30 น.", "info:ออกจากห้องสอบไม่ได้จนหมดเวลาสอบ"]);
    // 1 hour, KMITL (leave after 60): same.
    expect(texts2(session("09:00", "10:00"), "09:40:00", { lateEntryMinutes: 30, earlyLeaveMinutes: 60, lastLeaveMinutes: 0 })).toEqual([
      "closed:ปิดรับเข้าห้องสอบแล้ว (09:30 น.)",
      "closed:ออกจากห้องสอบไม่ได้จนหมดเวลาสอบ",
    ]);
  });

  it("judges the rules on the planned length, not on extra time", () => {
    // A 25-minute quiz has no late-entry notice; adding 10 minutes must not make one appear mid-exam.
    const quiz = session("09:00", "09:25");
    const extended = { ...quiz, endAt: quiz.endAt + 10 * 60_000 };
    const late = { lateEntryMinutes: 30, earlyLeaveMinutes: 0, lastLeaveMinutes: 0 };
    expect(roomNotices(extended, at("09:20:00"), late)).toEqual([]);
    // The final-15 window moves with the extension: 12:00 → 12:10 means seated from 11:55.
    const long = { ...s, endAt: s.endAt + 10 * 60_000 };
    expect(texts2(long, "11:50:00", rules)).toEqual(["closed:ปิดรับเข้าห้องสอบแล้ว (09:30 น.)", "open:ออกจากห้องสอบได้แล้ว"]);
    expect(texts2(long, "11:56:00", rules)).toEqual(["closed:ปิดรับเข้าห้องสอบแล้ว (09:30 น.)", "closed:15 นาทีสุดท้าย — กรุณานั่งรอจนหมดเวลา"]);
  });
});

function texts2(sess: ReturnType<typeof session>, time: string, rules: Parameters<typeof roomNotices>[2]) {
  return roomNotices(sess, at(time), rules).map((n) => `${n.state}:${n.text.th}`);
}
