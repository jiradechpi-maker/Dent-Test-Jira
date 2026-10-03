import { describe, expect, it } from "vitest";
import {
  ANNOUNCEMENT_ORDER,
  DEFAULT_SCRIPTS,
  announcementForMinutes,
  captionFor,
  combineScripts,
  crossedMoments,
  fillScript,
  momentTimes,
  speakableThai,
  scriptFor,
  spokenParts,
  timeText,
} from "./announcements";
import { splitForSpeech } from "./speech";

const at = (hh: number, mm = 0) => new Date(2026, 9, 3, hh, mm, 0).getTime();
const context = { startAt: at(9), endAt: at(12, 30), now: at(12, 22), title: "Fixed Prosthodontics", room: "DT01" };

describe("announcement scripts", () => {
  it("has Thai and English wording for every checkpoint", () => {
    for (const id of ANNOUNCEMENT_ORDER) {
      expect(DEFAULT_SCRIPTS[id].th.length).toBeGreaterThan(5);
      expect(DEFAULT_SCRIPTS[id].en.length).toBeGreaterThan(5);
    }
    expect(DEFAULT_SCRIPTS.m5.th).toContain("รหัสนักศึกษา");
    expect(DEFAULT_SCRIPTS.m5.en).toContain("student ID");
  });

  it("maps minutes to checkpoints", () => {
    expect(announcementForMinutes(60)).toBe("m60");
    expect(announcementForMinutes(5)).toBe("m5");
    expect(announcementForMinutes(7)).toBeNull();
  });

  it("writes times for the screen and for the voice", () => {
    expect(timeText(at(12, 30), "th", "caption")).toBe("12.30 น.");
    expect(timeText(at(12, 30), "th", "speech")).toBe("12 นาฬิกา 30 นาที");
    expect(timeText(at(15), "th", "speech")).toBe("15 นาฬิกาตรง");
    expect(timeText(at(15), "en", "caption")).toBe("15:00");
    expect(timeText(at(15), "en", "speech")).toBe("3 p.m.");
    expect(timeText(at(9, 5), "en", "speech")).toBe("9:05 a.m.");
    expect(timeText(at(12), "en", "speech")).toBe("12 noon");
  });

  it("fills placeholders", () => {
    expect(fillScript("{title} in {room} ends at {end}.", context, "en", "caption")).toBe("Fixed Prosthodontics in DT01 ends at 12:30.");
    expect(fillScript("{duration} · {remaining} · {added}", { ...context, addedMinutes: 5 }, "en", "caption")).toBe("3 hours 30 minutes · 8 minutes · 5 minutes");
    expect(fillScript("{duration} · {remaining}", context, "th", "caption")).toBe("3 ชั่วโมง 30 นาที · 8 นาที");
    expect(captionFor(DEFAULT_SCRIPTS.m60, context)).toEqual({
      th: "เหลือเวลาสอบอีก 1 ชั่วโมง การสอบจะสิ้นสุดเวลา 12.30 น.",
      en: "You have one hour remaining. The examination will end at 12:30.",
    });
  });

  it("uses staff wording, falling back to the standard text for an empty language", () => {
    const script = scriptFor("m5", { m5: { th: "เหลือ 5 นาที", en: "  " } });
    expect(script).toEqual({ th: "เหลือ 5 นาที", en: DEFAULT_SCRIPTS.m5.en });
  });

  it("speaks in the chosen order", () => {
    expect(spokenParts(DEFAULT_SCRIPTS.end, context, "th-en").map((p) => p.lang)).toEqual(["th", "en"]);
    expect(spokenParts(DEFAULT_SCRIPTS.end, context, "en-th").map((p) => p.lang)).toEqual(["en", "th"]);
    expect(spokenParts(DEFAULT_SCRIPTS.end, context, "en").map((p) => p.lang)).toEqual(["en"]);
    expect(spokenParts(DEFAULT_SCRIPTS.start, context, "th")[0]!.text).toContain("12 นาฬิกา 30 นาที");
  });

  it("makes staff-typed Thai readable by a Thai voice", () => {
    expect(speakableThai("เลิกสอบ 12:30 น. อย่าลืมเขียนชื่อและเลขที่ ID")).toBe("เลิกสอบ 12 นาฬิกา 30 นาที อย่าลืมเขียนชื่อและ รหัสนักศึกษา");
    expect(speakableThai("หมดเวลา 15.00 น.")).toBe("หมดเวลา 15 นาฬิกาตรง");
  });

  it("reads simultaneous moments as one announcement, in order", () => {
    const combined = combineScripts(["m15", "lastLeave"], {});
    expect(combined.en).toBe(`${DEFAULT_SCRIPTS.m15.en} ${DEFAULT_SCRIPTS.lastLeave.en}`);
    expect(combineScripts(["lastLeave", "m15"], {})).toEqual(combined);
  });
});

describe("rule-based moments", () => {
  const session = { startAt: at(9), endAt: at(12) };
  const rules = { lateEntryMinutes: 30, earlyLeaveMinutes: 60, lastLeaveMinutes: 15 };

  it("places each moment from the room rules", () => {
    expect(momentTimes(session, rules)).toEqual([
      { id: "prestart", at: at(8, 55) },
      { id: "entryClosed", at: at(9, 30) },
      { id: "mayLeave", at: at(10) },
      { id: "lastLeave", at: at(11, 45) },
    ]);
    expect(momentTimes(session, { lateEntryMinutes: 0, earlyLeaveMinutes: 0, lastLeaveMinutes: 0 }).map((m) => m.id)).toEqual(["prestart"]);
  });

  it("fires a moment once, on the tick that crosses it", () => {
    expect(crossedMoments(session, rules, at(9, 29) + 59_500, at(9, 30))).toEqual(["entryClosed"]);
    expect(crossedMoments(session, rules, at(9, 30), at(9, 30) + 500)).toEqual([]);
  });

  it("skips a may-leave time that falls inside the no-leaving window", () => {
    const short = { startAt: at(9), endAt: at(10) };
    expect(momentTimes(short, rules).map((m) => m.id)).toEqual(["prestart", "entryClosed", "lastLeave"]);
  });
});

describe("splitting speech", () => {
  it("splits English by sentence and long Thai at spaces", () => {
    expect(splitForSpeech("Time is up. Please stop writing.")).toEqual(["Time is up.", "Please stop writing."]);
    const thai = DEFAULT_SCRIPTS.m5.th;
    const chunks = splitForSpeech(thai, 60);
    // Thai has no spaces inside a phrase, so a chunk may only run long when it is a single phrase.
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 60 || !c.includes(" "))).toBe(true);
    expect(chunks.join(" ")).toBe(thai);
  });
});
