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

  let startAt = now;
  if (options.startTime) {
    const parsed = todayAt(now, options.startTime);
    if (parsed === null) return { ok: false, error: "invalid-start" };
    if (parsed >= endAt) return { ok: false, error: "start-after-end" };
    // A start time already in the past simply means "the exam is already running".
    startAt = parsed;
  }
  return { ok: true, session: { startAt, endAt, createdAt: now } };
}

export function createSessionFromDuration(now: number, minutes: number): ExamSession {
  return { startAt: now, endAt: now + Math.round(minutes * 60_000), createdAt: now };
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
