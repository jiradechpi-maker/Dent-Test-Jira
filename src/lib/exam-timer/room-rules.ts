/**
 * Exam-room door rules shown on the projector: how late a candidate may still come in, and from when candidates
 * may leave. The defaults follow the institute's examination regulation (ข้อ ๒): no entry more than 30 minutes
 * after the start, and no leaving in the first hour. Lecturers often choose stricter or shorter rules, so each
 * rule is a short list of choices.
 */

import type { Bi } from "@/lib/i18n/locale";
import { formatClock, phaseAt, type ExamSession } from "./timing";

export interface RoomRules {
  /** Candidates may come in up to this many minutes after the start (0 = no late entry). */
  lateEntryMinutes: number;
  /** Candidates may leave only after this many minutes. */
  earlyLeaveMinutes: number;
}

export const LATE_ENTRY_CHOICES = [0, 15, 30] as const;
export const EARLY_LEAVE_CHOICES = [30, 60] as const;

/** ข้อบังคับสถาบัน ข้อ ๒: late by at most 30 minutes; nobody leaves in the first hour. */
export const REGULATION_RULES: RoomRules = { lateEntryMinutes: 30, earlyLeaveMinutes: 60 };

export function normalizeRules(value: unknown): RoomRules {
  const v = (typeof value === "object" && value !== null ? value : {}) as Partial<RoomRules>;
  const pick = (n: unknown, choices: readonly number[], fallback: number) => (typeof n === "number" && choices.includes(n) ? n : fallback);
  return {
    lateEntryMinutes: pick(v.lateEntryMinutes, LATE_ENTRY_CHOICES, REGULATION_RULES.lateEntryMinutes),
    earlyLeaveMinutes: pick(v.earlyLeaveMinutes, EARLY_LEAVE_CHOICES, REGULATION_RULES.earlyLeaveMinutes),
  };
}

const minutesBi = (minutes: number): Bi =>
  minutes === 60 ? { th: "1 ชั่วโมง", en: "1 hour" } : { th: `${minutes} นาที`, en: `${minutes} minutes` };

/** "เข้าห้องสอบสายได้ไม่เกิน 30 นาที · ออกจากห้องสอบได้เมื่อสอบไปแล้ว 1 ชั่วโมง" */
export function describeRules(rules: RoomRules): Bi {
  const leave = minutesBi(rules.earlyLeaveMinutes);
  const entry: Bi =
    rules.lateEntryMinutes === 0
      ? { th: "ไม่อนุญาตให้เข้าห้องสอบสาย", en: "No late entry" }
      : { th: `เข้าห้องสอบสายได้ไม่เกิน ${rules.lateEntryMinutes} นาที`, en: `Late entry up to ${rules.lateEntryMinutes} minutes` };
  return {
    th: `${entry.th} · ออกจากห้องสอบได้เมื่อสอบไปแล้ว ${leave.th}`,
    en: `${entry.en} · you may leave after ${leave.en}`,
  };
}

export function isRegulation(rules: RoomRules): boolean {
  return rules.lateEntryMinutes === REGULATION_RULES.lateEntryMinutes && rules.earlyLeaveMinutes === REGULATION_RULES.earlyLeaveMinutes;
}

export interface RoomNotice {
  key: "entry" | "leave";
  text: Bi;
  /** "open" = allowed now, "closed" = not allowed now, "info" = before the exam starts. */
  state: "open" | "closed" | "info";
}

/**
 * The door rules, worded for the current moment, in Thai and English. The rules count from the start, so they
 * hold whatever the finish time; an extension can only open a leaving window that the original finish had none of.
 */
export function roomNotices(session: ExamSession, now: number, rules: RoomRules): RoomNotice[] {
  const phase = phaseAt(session, now);
  if (phase === "ended") return [];
  const notices: RoomNotice[] = [];
  const minute = 60_000;
  const start = formatClock(session.startAt);

  if (rules.lateEntryMinutes === 0) {
    notices.push(
      phase === "waiting"
        ? { key: "entry", state: "info", text: { th: `เข้าห้องสอบก่อน ${start} น. · ไม่อนุญาตให้เข้าสาย`, en: `Be seated by ${start} · no late entry` } }
        : { key: "entry", state: "closed", text: { th: `ปิดรับเข้าห้องสอบแล้ว (${start} น.)`, en: `Entry closed (${start})` } },
    );
  } else if (session.startAt + rules.lateEntryMinutes * minute < session.endAt) {
    const closesAt = session.startAt + rules.lateEntryMinutes * minute;
    const until = formatClock(closesAt);
    const openText = { th: `เข้าห้องสอบได้ถึง ${until} น.`, en: `Late entry until ${until}` };
    if (phase === "waiting") notices.push({ key: "entry", state: "info", text: openText });
    else if (now < closesAt) notices.push({ key: "entry", state: "open", text: openText });
    else notices.push({ key: "entry", state: "closed", text: { th: `ปิดรับเข้าห้องสอบแล้ว (${until} น.)`, en: `Entry closed (${until})` } });
  }

  const leaveFrom = session.startAt + rules.earlyLeaveMinutes * minute;
  if (leaveFrom >= session.endAt) {
    // e.g. a 1-hour exam under the regulation: there is no time when leaving is allowed.
    notices.push({ key: "leave", state: phase === "waiting" ? "info" : "closed", text: { th: "ออกจากห้องสอบไม่ได้จนหมดเวลาสอบ", en: "No leaving until the exam ends" } });
  } else {
    const from = formatClock(leaveFrom);
    if (phase === "waiting") notices.push({ key: "leave", state: "info", text: { th: `ออกจากห้องสอบได้ตั้งแต่ ${from} น.`, en: `You may leave from ${from}` } });
    else if (now < leaveFrom) notices.push({ key: "leave", state: "closed", text: { th: `ยังออกจากห้องสอบไม่ได้ จนถึง ${from} น.`, en: `No leaving until ${from}` } });
    else notices.push({ key: "leave", state: "open", text: { th: "ออกจากห้องสอบได้แล้ว", en: "You may now leave" } });
  }
  return notices;
}
