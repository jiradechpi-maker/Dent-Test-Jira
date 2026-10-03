/**
 * Exam-room door rules shown on the projector: until when latecomers may enter, from when candidates may leave,
 * and the quiet final minutes when nobody leaves. Almost every institution closes late entry 30 minutes in;
 * they differ on the earliest leaving time (30, 45 or 60 minutes) and on a final no-leaving window (10 or 15).
 */

import type { Bi } from "@/lib/i18n/locale";
import { formatClock, phaseAt, type ExamSession } from "./timing";

export interface RoomRules {
  /** Candidates may enter until this many minutes after the start (0 = no rule). */
  lateEntryMinutes: number;
  /** Candidates may leave only after this many minutes (0 = no rule). */
  earlyLeaveMinutes: number;
  /** Candidates may not leave in the last N minutes (0 = no rule). */
  lastLeaveMinutes: number;
}

export type RulePresetId = "international" | "kmitl" | "chula" | "uk-hk" | "none" | "custom";

export interface RulePreset {
  id: Exclude<RulePresetId, "custom">;
  name: Bi;
  rules: RoomRules;
  /** Where the numbers come from. */
  source: Bi;
}

export const RULE_PRESETS: RulePreset[] = [
  {
    id: "international",
    name: { th: "มาตรฐานสากล", en: "International standard" },
    rules: { lateEntryMinutes: 30, earlyLeaveMinutes: 60, lastLeaveMinutes: 15 },
    source: { th: "แบบ IB (International Baccalaureate)", en: "As used by the IB" },
  },
  {
    id: "kmitl",
    name: { th: "แบบ สจล.", en: "KMITL style" },
    rules: { lateEntryMinutes: 30, earlyLeaveMinutes: 60, lastLeaveMinutes: 0 },
    source: { th: "ระเบียบการสอบ คณะวิศวกรรมศาสตร์ สจล.", en: "KMITL Faculty of Engineering exam rules" },
  },
  {
    id: "chula",
    name: { th: "แบบมหาวิทยาลัยไทย", en: "Thai university style" },
    rules: { lateEntryMinutes: 30, earlyLeaveMinutes: 45, lastLeaveMinutes: 0 },
    source: { th: "ระเบียบการสอบ จุฬาลงกรณ์มหาวิทยาลัย", en: "Chulalongkorn University exam rules" },
  },
  {
    id: "uk-hk",
    name: { th: "แบบอังกฤษ / ฮ่องกง", en: "UK / Hong Kong style" },
    rules: { lateEntryMinutes: 30, earlyLeaveMinutes: 30, lastLeaveMinutes: 15 },
    source: { th: "University of Bristol, CUHK", en: "University of Bristol, CUHK" },
  },
  {
    id: "none",
    name: { th: "ไม่แสดงกติกา", en: "No rules on screen" },
    rules: { lateEntryMinutes: 0, earlyLeaveMinutes: 0, lastLeaveMinutes: 0 },
    source: { th: "", en: "" },
  },
];

export const DEFAULT_RULE_PRESET: RulePresetId = "international";

export const LATE_ENTRY_OPTIONS = [0, 15, 30, 45, 60] as const;
export const EARLY_LEAVE_OPTIONS = [0, 30, 45, 60] as const;
export const LAST_LEAVE_OPTIONS = [0, 10, 15] as const;

export function rulesFor(preset: RulePresetId, custom: RoomRules): RoomRules {
  if (preset === "custom") return custom;
  return (RULE_PRESETS.find((p) => p.id === preset) ?? RULE_PRESETS[0]!).rules;
}

/** "เข้าห้องได้ภายใน 30 นาทีแรก · ออกได้หลัง 60 นาที · งดออก 15 นาทีสุดท้าย" */
export function describeRules(rules: RoomRules): Bi {
  const th: string[] = [];
  const en: string[] = [];
  if (rules.lateEntryMinutes) {
    th.push(`เข้าห้องได้ภายใน ${rules.lateEntryMinutes} นาทีแรก`);
    en.push(`late entry up to ${rules.lateEntryMinutes} min`);
  }
  if (rules.earlyLeaveMinutes) {
    th.push(`ออกได้หลัง ${rules.earlyLeaveMinutes} นาที`);
    en.push(`leave after ${rules.earlyLeaveMinutes} min`);
  }
  if (rules.lastLeaveMinutes) {
    th.push(`งดออก ${rules.lastLeaveMinutes} นาทีสุดท้าย`);
    en.push(`no leaving in the final ${rules.lastLeaveMinutes} min`);
  }
  if (!th.length) return { th: "ไม่แสดงกติกาบนจอ", en: "No rules on screen" };
  const enText = en.join(" · ");
  return { th: th.join(" · "), en: enText.charAt(0).toUpperCase() + enText.slice(1) };
}

export interface RoomNotice {
  key: "entry" | "leave" | "last";
  text: Bi;
  /** "open" = allowed now, "closed" = not allowed now, "info" = before the exam starts. */
  state: "open" | "closed" | "info";
}

/** The door rules, worded for the current moment, in Thai and English. */
export function roomNotices(session: ExamSession, now: number, rules: RoomRules): RoomNotice[] {
  const phase = phaseAt(session, now);
  if (phase === "ended") return [];
  const notices: RoomNotice[] = [];
  const total = session.endAt - session.startAt;
  if (rules.lateEntryMinutes > 0 && rules.lateEntryMinutes * 60_000 < total) {
    const until = formatClock(session.startAt + rules.lateEntryMinutes * 60_000);
    const openText = { th: `เข้าห้องสอบได้ถึง ${until} น.`, en: `Late entry until ${until}` };
    if (phase === "waiting") notices.push({ key: "entry", state: "info", text: openText });
    else if (now < session.startAt + rules.lateEntryMinutes * 60_000) notices.push({ key: "entry", state: "open", text: openText });
    else notices.push({ key: "entry", state: "closed", text: { th: `ปิดรับเข้าห้องสอบแล้ว (${until} น.)`, en: `Entry closed (${until})` } });
  }
  const leaveFrom = rules.earlyLeaveMinutes > 0 ? session.startAt + rules.earlyLeaveMinutes * 60_000 : session.startAt;
  const leaveUntil = rules.lastLeaveMinutes > 0 ? session.endAt - rules.lastLeaveMinutes * 60_000 : session.endAt;
  if (rules.earlyLeaveMinutes > 0 && leaveFrom < leaveUntil) {
    const from = formatClock(leaveFrom);
    if (phase === "waiting") notices.push({ key: "leave", state: "info", text: { th: `ออกจากห้องสอบได้ตั้งแต่ ${from} น.`, en: `You may leave from ${from}` } });
    else if (now < leaveFrom) notices.push({ key: "leave", state: "closed", text: { th: `ยังออกจากห้องสอบไม่ได้ จนถึง ${from} น.`, en: `No leaving until ${from}` } });
    else if (now < leaveUntil) notices.push({ key: "leave", state: "open", text: { th: "ออกจากห้องสอบได้แล้ว", en: "You may now leave" } });
  }
  if (rules.lastLeaveMinutes > 0 && rules.lastLeaveMinutes * 60_000 < total) {
    const m = rules.lastLeaveMinutes;
    if (phase === "running" && now >= leaveUntil) {
      notices.push({ key: "last", state: "closed", text: { th: `${m} นาทีสุดท้าย — กรุณานั่งรอจนหมดเวลา`, en: `Final ${m} minutes — please remain seated` } });
    } else if (phase === "waiting") {
      notices.push({ key: "last", state: "info", text: { th: `งดออกจากห้อง ${m} นาทีสุดท้าย`, en: `No leaving in the final ${m} minutes` } });
    }
  }
  return notices;
}
