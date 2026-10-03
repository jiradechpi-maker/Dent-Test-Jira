/**
 * Pure timing logic for the exam timer. All times are epoch milliseconds so the
 * countdown is always derived from the clock — it can never drift, even if the
 * browser throttles timers in a background tab.
 */

import { parseTime } from "@/lib/thai";

export type TimerPhase = "waiting" | "running" | "ended";

export interface ExamSession {
  /** When the exam starts (ms). Equal to `createdAt` when the exam starts immediately. */
  startAt: number;
  /** When the exam ends (ms). */
  endAt: number;
  createdAt: number;
  /** End time before any "+5 นาที" extension; absent on sessions saved by older versions. */
  plannedEndAt?: number;
}

/** Epoch ms for today's local "HH:mm" relative to `now`. */
export function todayAt(now: number, hhmm: string): number | null {
  const t = parseTime(hhmm);
  if (!t) return null;
  const date = new Date(now);
  date.setHours(t.hours, t.minutes, 0, 0);
  return date.getTime();
}

export type SessionError = "invalid-end" | "end-in-past" | "invalid-start" | "start-after-end";

export function createSession(
  now: number,
  options: { endTime: string; startTime: string | null },
): { ok: true; session: ExamSession } | { ok: false; error: SessionError } {
  const endAt = todayAt(now, options.endTime);
  if (endAt === null) return { ok: false, error: "invalid-end" };
  if (endAt <= now) return { ok: false, error: "end-in-past" };

  let startAt = Math.floor(now / 60_000) * 60_000;
  if (options.startTime) {
    const parsed = todayAt(now, options.startTime);
    if (parsed === null) return { ok: false, error: "invalid-start" };
    if (parsed >= endAt) return { ok: false, error: "start-after-end" };
    // A start time already in the past simply means "the exam is already running".
    startAt = parsed;
  }
  return { ok: true, session: { startAt, endAt, createdAt: now, plannedEndAt: endAt } };
}

/** Starts on the current whole minute so the screen reads e.g. 10:07–11:07 and "1 ชั่วโมง", not 10:07–11:08. */
export function createSessionFromDuration(now: number, minutes: number): ExamSession {
  const startAt = Math.floor(now / 60_000) * 60_000;
  const endAt = startAt + Math.round(minutes * 60_000);
  return { startAt, endAt, createdAt: now, plannedEndAt: endAt };
}

/** Minutes added with the extend buttons (0 when none). */
export function extensionMs(session: ExamSession): number {
  return Math.max(0, session.endAt - (session.plannedEndAt ?? session.endAt));
}

export interface RoomRules {
  /** Candidates may enter until this many minutes after the start (0 = no rule). */
  lateEntryMinutes: number;
  /** Candidates may leave only after this many minutes (0 = no rule). */
  earlyLeaveMinutes: number;
  /** Candidates may not leave in the last N minutes, to keep the end of the exam quiet (0 = no rule). */
  lastLeaveMinutes: number;
}

export interface RoomNotice {
  key: "entry" | "leave" | "last";
  text: string;
  /** "open" = allowed now, "closed" = not allowed now, "info" = before the exam starts. */
  state: "open" | "closed" | "info";
}

/** The door rules invigilators announce, worded for the current moment. */
export function roomNotices(session: ExamSession, now: number, rules: RoomRules): RoomNotice[] {
  const phase = phaseAt(session, now);
  if (phase === "ended") return [];
  const notices: RoomNotice[] = [];
  const total = session.endAt - session.startAt;
  if (rules.lateEntryMinutes > 0 && rules.lateEntryMinutes * 60_000 < total) {
    const until = session.startAt + rules.lateEntryMinutes * 60_000;
    if (phase === "waiting") notices.push({ key: "entry", state: "info", text: `เข้าห้องสอบได้ถึง ${formatClock(until)} น.` });
    else if (now < until) notices.push({ key: "entry", state: "open", text: `เข้าห้องสอบได้ถึง ${formatClock(until)} น.` });
    else notices.push({ key: "entry", state: "closed", text: `ปิดรับเข้าห้องสอบแล้ว (${formatClock(until)} น.)` });
  }
  const leaveFrom = rules.earlyLeaveMinutes > 0 ? session.startAt + rules.earlyLeaveMinutes * 60_000 : session.startAt;
  const leaveUntil = rules.lastLeaveMinutes > 0 ? session.endAt - rules.lastLeaveMinutes * 60_000 : session.endAt;
  if (rules.earlyLeaveMinutes > 0 && leaveFrom < session.endAt) {
    if (phase === "waiting") notices.push({ key: "leave", state: "info", text: `ออกจากห้องสอบได้ตั้งแต่ ${formatClock(leaveFrom)} น.` });
    else if (now < leaveFrom) notices.push({ key: "leave", state: "closed", text: `ยังออกจากห้องสอบไม่ได้ จนถึง ${formatClock(leaveFrom)} น.` });
    else if (now < leaveUntil) notices.push({ key: "leave", state: "open", text: "ออกจากห้องสอบได้แล้ว" });
  }
  if (rules.lastLeaveMinutes > 0 && leaveUntil > session.startAt) {
    if (now >= leaveUntil && phase === "running") {
      notices.push({ key: "last", state: "closed", text: `${rules.lastLeaveMinutes} นาทีสุดท้าย — กรุณานั่งรอจนหมดเวลา` });
    } else if (phase === "waiting") {
      notices.push({ key: "last", state: "info", text: `งดออกจากห้อง ${rules.lastLeaveMinutes} นาทีสุดท้าย` });
    }
  }
  return notices;
}

export function phaseAt(session: ExamSession, now: number): TimerPhase {
  if (now < session.startAt) return "waiting";
  if (now < session.endAt) return "running";
  return "ended";
}

/** Milliseconds until the next boundary (start when waiting, end when running, 0 when ended). */
export function remainingMs(session: ExamSession, now: number): number {
  const phase = phaseAt(session, now);
  if (phase === "waiting") return session.startAt - now;
  if (phase === "running") return session.endAt - now;
  return 0;
}

/** Fraction of exam time elapsed, 0 → 1. */
export function progressAt(session: ExamSession, now: number): number {
  const total = session.endAt - session.startAt;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now - session.startAt) / total));
}

/**
 * Splits a remaining duration into display parts. Rounds *up* to the whole second,
 * so the display reads 00:00 exactly when time is up (never a second early).
 */
export function splitDuration(ms: number): { hours: number; minutes: number; seconds: number; totalSeconds: number } {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
  };
}

export function formatCountdown(ms: number): string {
  const { hours, minutes, seconds } = splitDuration(ms);
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatClock(ms: number, withSeconds = false): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (!withSeconds) return `${hh}:${mm}`;
  return `${hh}:${mm}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export function formatDurationThai(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  if (totalMinutes % 60 === 30 && totalMinutes > 60) return `${Math.floor(totalMinutes / 60)} ชั่วโมงครึ่ง`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h && m) return `${h} ชม. ${m} นาที`;
  if (h) return `${h} ชั่วโมง`;
  return `${m} นาที`;
}

export type Urgency = "calm" | "notice" | "warning" | "critical" | "ended";

/** Visual urgency for the running phase: ≤15 min notice, ≤5 min warning, ≤1 min critical. */
export function urgencyAt(session: ExamSession, now: number): Urgency {
  const phase = phaseAt(session, now);
  if (phase === "ended") return "ended";
  if (phase === "waiting") return "calm";
  const left = session.endAt - now;
  if (left <= 60_000) return "critical";
  if (left <= 5 * 60_000) return "warning";
  if (left <= 15 * 60_000) return "notice";
  return "calm";
}

/**
 * Returns the warning thresholds (in minutes) crossed between two ticks of the running phase.
 * Crossing is detected on the *transition*, so a throttled tab still fires each warning once
 * and reloading mid-exam never replays warnings that already passed.
 */
export function crossedThresholds(session: ExamSession, prevNow: number, now: number, thresholdsMinutes: number[]): number[] {
  if (now <= prevNow) return [];
  const prevLeft = session.endAt - prevNow;
  const left = session.endAt - now;
  return thresholdsMinutes.filter((m) => {
    const t = m * 60_000;
    return prevLeft > t && left <= t && left > 0;
  });
}

export function didStart(session: ExamSession, prevNow: number, now: number): boolean {
  return prevNow < session.startAt && now >= session.startAt && now < session.endAt;
}

export function didEnd(session: ExamSession, prevNow: number, now: number): boolean {
  return prevNow < session.endAt && now >= session.endAt;
}
