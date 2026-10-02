import { describe, expect, it } from "vitest";
import {
  createSession,
  crossedThresholds,
  didEnd,
  didStart,
  formatCountdown,
  phaseAt,
  remainingMs,
  splitDuration,
  todayAt,
  urgencyAt,
} from "./timing";

const at = (hhmmss: string) => {
  const [h = 0, m = 0, s = 0] = hhmmss.split(":").map(Number);
  return new Date(2026, 9, 2, h, m, s).getTime();
};

describe("createSession", () => {
  it("standby at 08:47, exam 09:00–10:00 → waits, then runs automatically", () => {
    const now = at("08:47:00");
    const result = createSession(now, { startTime: "09:00", endTime: "10:00" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const s = result.session;
    expect(phaseAt(s, now)).toBe("waiting");
    expect(remainingMs(s, now)).toBe(13 * 60_000);
    expect(phaseAt(s, at("09:00:00"))).toBe("running");
    expect(remainingMs(s, at("09:00:00"))).toBe(60 * 60_000);
    expect(phaseAt(s, at("10:00:00"))).toBe("ended");
  });

  it("starting now counts down to the end time", () => {
    const now = at("09:12:30");
    const result = createSession(now, { startTime: null, endTime: "11:00" });
    expect(result.ok && remainingMs(result.session, now)).toBe((47 * 60 + 30) * 1000 + 60 * 60_000);
  });

  it("validates input", () => {
    const now = at("10:30:00");
    expect(createSession(now, { startTime: null, endTime: "10:00" })).toEqual({ ok: false, error: "end-in-past" });
    expect(createSession(now, { startTime: null, endTime: "" })).toEqual({ ok: false, error: "invalid-end" });
    expect(createSession(now, { startTime: "12:00", endTime: "11:00" })).toEqual({ ok: false, error: "start-after-end" });
  });

  it("a start time already passed means the exam is running", () => {
    const now = at("09:05:00");
    const result = createSession(now, { startTime: "09:00", endTime: "10:00" });
    expect(result.ok && phaseAt(result.session, now)).toBe("running");
  });
});

describe("display", () => {
  it("rounds up so 00:00 appears exactly at the end", () => {
    expect(formatCountdown(1)).toBe("00:01");
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(59_001)).toBe("01:00");
    expect(formatCountdown(3_600_000)).toBe("1:00:00");
    expect(splitDuration(-5).totalSeconds).toBe(0);
  });

  it("todayAt rejects bad input", () => {
    expect(todayAt(at("08:00:00"), "9:00")).toBeNull();
    expect(todayAt(at("08:00:00"), "09:00")).toBe(at("09:00:00"));
  });
});

describe("events", () => {
  const session = { startAt: at("09:00:00"), endAt: at("10:00:00"), createdAt: at("08:47:00") };

  it("fires warnings once on crossing, even across a long gap", () => {
    expect(crossedThresholds(session, at("09:44:59"), at("09:45:00"), [30, 15, 5])).toEqual([15]);
    expect(crossedThresholds(session, at("09:45:00"), at("09:45:01"), [30, 15, 5])).toEqual([]);
    // Background tab throttled for 20 minutes: both 30 and 15 crossed.
    expect(crossedThresholds(session, at("09:25:00"), at("09:46:00"), [30, 15, 5])).toEqual([30, 15]);
    expect(crossedThresholds(session, at("09:59:00"), at("10:00:01"), [5])).toEqual([]);
  });

  it("detects start and end transitions", () => {
    expect(didStart(session, at("08:59:59"), at("09:00:00"))).toBe(true);
    expect(didStart(session, at("09:00:00"), at("09:00:01"))).toBe(false);
    expect(didEnd(session, at("09:59:59"), at("10:00:00"))).toBe(true);
    expect(didEnd(session, at("10:00:00"), at("10:00:01"))).toBe(false);
  });

  it("escalates urgency", () => {
    expect(urgencyAt(session, at("09:30:00"))).toBe("calm");
    expect(urgencyAt(session, at("09:45:00"))).toBe("notice");
    expect(urgencyAt(session, at("09:55:00"))).toBe("warning");
    expect(urgencyAt(session, at("09:59:30"))).toBe("critical");
    expect(urgencyAt(session, at("10:00:00"))).toBe("ended");
  });
});
