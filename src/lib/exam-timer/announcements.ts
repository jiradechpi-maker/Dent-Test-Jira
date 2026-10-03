/**
 * What the exam room hears and reads at each moment of a written exam. Wording follows common invigilator
 * scripts (Cambridge International, JCQ, UK/HK university exam halls): a pre-start reminder, "you may begin",
 * time checks, the door rules, and "stop writing" — in formal Thai and plain international English.
 * Staff can rewrite any script; placeholders are filled when the announcement plays.
 */

import type { Bi } from "@/lib/i18n/locale";

export type MinuteId = "m60" | "m30" | "m15" | "m10" | "m5";
export type MomentId = "prestart" | "start" | "entryClosed" | "mayLeave" | "lastLeave" | "end" | "extend";
export type AnnouncementId = MinuteId | MomentId;

/** Minutes-remaining checkpoints the staff can switch on, largest first. */
export const WARNING_MINUTES = [60, 30, 15, 10, 5] as const;
export type WarningMinutes = (typeof WARNING_MINUTES)[number];
export const DEFAULT_WARNINGS: WarningMinutes[] = [60, 30, 15, 5];

/** Minutes before the start at which the pre-start reminder plays. */
export const PRESTART_MINUTES = 5;

/** Display and playback order (when several fall on the same second they are spoken in this order). */
export const ANNOUNCEMENT_ORDER: AnnouncementId[] = [
  "prestart",
  "start",
  "entryClosed",
  "mayLeave",
  "m60",
  "m30",
  "m15",
  "lastLeave",
  "m10",
  "m5",
  "end",
  "extend",
];

export const DEFAULT_MOMENTS: Record<MomentId, boolean> = {
  prestart: true,
  start: true,
  entryClosed: false,
  mayLeave: false,
  lastLeave: false,
  end: true,
  extend: true,
};

/** Order in which the two languages are spoken. Captions always show both. */
export type VoiceLanguage = "th" | "en" | "th-en" | "en-th";

export const ANNOUNCEMENT_LABELS: Record<AnnouncementId, Bi> = {
  prestart: { th: `ก่อนเริ่ม ${PRESTART_MINUTES} นาที`, en: `${PRESTART_MINUTES} min before start` },
  start: { th: "เริ่มสอบ", en: "Start" },
  entryClosed: { th: "ปิดรับผู้มาสาย", en: "Late entry closed" },
  mayLeave: { th: "ออกจากห้องได้", en: "May leave" },
  m60: { th: "เหลือ 1 ชั่วโมง", en: "1 hour left" },
  m30: { th: "เหลือ 30 นาที", en: "30 minutes left" },
  m15: { th: "เหลือ 15 นาที", en: "15 minutes left" },
  lastLeave: { th: "งดออกช่วงท้าย", en: "No more leaving" },
  m10: { th: "เหลือ 10 นาที", en: "10 minutes left" },
  m5: { th: "เหลือ 5 นาที", en: "5 minutes left" },
  end: { th: "หมดเวลา", en: "Time up" },
  extend: { th: "ขยายเวลา", en: "Extension" },
};

/** When each moment fires, for the operator. */
export const ANNOUNCEMENT_WHEN: Partial<Record<AnnouncementId, Bi>> = {
  prestart: { th: "นับถอยหลังก่อนเวลาเริ่ม", en: "during the countdown to the start" },
  entryClosed: { th: "ตามกติกา “เข้าห้องสอบได้ไม่เกิน”", en: "at the late-entry limit" },
  mayLeave: { th: "ตามกติกา “ออกจากห้องได้หลัง”", en: "at the earliest-leaving time" },
  lastLeave: { th: "ตามกติกา “งดออกช่วงท้าย”", en: "at the final-minutes rule" },
  extend: { th: "เมื่อกดขยายเวลา", en: "when you extend the time" },
};

export const DEFAULT_SCRIPTS: Record<AnnouncementId, Bi> = {
  prestart: {
    th: "การสอบจะเริ่มในอีก 5 นาที กรุณาปิดโทรศัพท์มือถือและนาฬิกาอัจฉริยะ เก็บไว้ในกระเป๋าหน้าห้องสอบ วางบัตรนักศึกษาไว้บนโต๊ะ และห้ามเปิดข้อสอบจนกว่าจะได้รับอนุญาต",
    en: "The examination will begin in 5 minutes. Please switch off your mobile phone and smart watch and leave them in your bag at the front of the room. Place your student ID card on your desk, and do not open the question paper until you are told to begin.",
  },
  start: {
    th: "เริ่มการสอบ การสอบครั้งนี้มีเวลา {duration} และจะสิ้นสุดเวลา {end} กรุณาเขียนชื่อ นามสกุล และรหัสนักศึกษา ในกระดาษคำตอบทุกแผ่น นักศึกษาเริ่มทำข้อสอบได้",
    en: "The examination begins now. You have {duration}, and the examination will end at {end}. Please write your full name and student ID on every answer sheet. You may now begin.",
  },
  entryClosed: {
    th: "ขณะนี้ปิดรับผู้เข้าสอบที่มาสายแล้ว",
    en: "Late entry to the examination is now closed.",
  },
  mayLeave: {
    th: "นักศึกษาที่ทำข้อสอบเสร็จแล้ว สามารถออกจากห้องสอบได้ กรุณายกมือ รอกรรมการคุมสอบเก็บกระดาษคำตอบ และออกจากห้องอย่างเงียบ",
    en: "If you have finished, you may now leave. Please raise your hand, wait for an invigilator to collect your answer sheets, and leave quietly.",
  },
  m60: {
    th: "เหลือเวลาสอบอีก 1 ชั่วโมง การสอบจะสิ้นสุดเวลา {end}",
    en: "You have one hour remaining. The examination will end at {end}.",
  },
  m30: {
    th: "เหลือเวลาสอบอีก 30 นาที",
    en: "You have 30 minutes remaining.",
  },
  m15: {
    th: "เหลือเวลาสอบอีก 15 นาที",
    en: "You have 15 minutes remaining.",
  },
  lastLeave: {
    th: "นับจากนี้ ไม่อนุญาตให้ออกจากห้องสอบ จนกว่าจะหมดเวลาสอบ",
    en: "From now until the end of the examination, you may not leave the room.",
  },
  m10: {
    th: "เหลือเวลาสอบอีก 10 นาที",
    en: "You have 10 minutes remaining.",
  },
  m5: {
    th: "เหลือเวลาสอบอีก 5 นาที กรุณาตรวจสอบความถูกต้องของคำตอบ และตรวจสอบว่าได้เขียนชื่อ นามสกุล และรหัสนักศึกษา ในกระดาษคำตอบครบทุกแผ่นแล้ว",
    en: "You have 5 minutes remaining. Please check your answers, and make sure your full name and student ID are written on every answer sheet.",
  },
  end: {
    th: "หมดเวลาสอบ กรุณาหยุดเขียนทันทีและวางปากกาลง นั่งอยู่กับที่และงดการสนทนา จนกว่ากรรมการคุมสอบจะเก็บกระดาษคำตอบครบ และอนุญาตให้ออกจากห้องสอบ",
    en: "Time is up. Stop writing now and put your pens down. Please remain seated and silent until all answer sheets have been collected and you are told you may leave.",
  },
  extend: {
    th: "ขยายเวลาสอบออกไปอีก {added} การสอบจะสิ้นสุดเวลา {end}",
    en: "The examination has been extended by {added}. It will now end at {end}.",
  },
};

export const PLACEHOLDERS: { token: string; meaning: Bi }[] = [
  { token: "{end}", meaning: { th: "เวลาเลิกสอบ", en: "finish time" } },
  { token: "{start}", meaning: { th: "เวลาเริ่มสอบ", en: "start time" } },
  { token: "{duration}", meaning: { th: "ระยะเวลาสอบ", en: "exam length" } },
  { token: "{remaining}", meaning: { th: "เวลาที่เหลือขณะประกาศ", en: "time left when spoken" } },
  { token: "{added}", meaning: { th: "เวลาที่ขยาย", en: "time added" } },
  { token: "{title}", meaning: { th: "ชื่อการสอบ", en: "exam title" } },
  { token: "{room}", meaning: { th: "ห้องสอบ", en: "room" } },
];

export function isMinuteId(id: AnnouncementId): id is MinuteId {
  return /^m\d+$/.test(id);
}

export function announcementForMinutes(minutes: number): MinuteId | null {
  const id = `m${minutes}`;
  return (WARNING_MINUTES as readonly number[]).includes(minutes) ? (id as MinuteId) : null;
}

export interface AnnouncementContext {
  startAt: number;
  endAt: number;
  /** When the announcement plays — used for {remaining}. */
  now: number;
  title: string;
  room: string;
  /** Minutes added by the latest extension — used for {added}. */
  addedMinutes?: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * How a time is written on screen and how it should be spoken. Thai TTS misreads "12:30" and "น.",
 * so speech uses "12 นาฬิกา 30 นาที"; English speech uses the 12-hour clock ("3 p.m.") that voices say naturally.
 */
export function timeText(ms: number, lang: "th" | "en", mode: "caption" | "speech"): string {
  const date = new Date(ms);
  const h = date.getHours();
  const m = date.getMinutes();
  if (mode === "caption") return lang === "th" ? `${pad(h)}.${pad(m)} น.` : `${pad(h)}:${pad(m)}`;
  if (lang === "th") return m ? `${h} นาฬิกา ${m} นาที` : `${h} นาฬิกาตรง`;
  if (h === 0 && m === 0) return "midnight";
  if (h === 12 && m === 0) return "12 noon";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${pad(m)}` : ""} ${h < 12 ? "a.m." : "p.m."}`;
}

/** 180 → "3 ชั่วโมง" / "3 hours"; 90 → "1 ชั่วโมง 30 นาที" / "1 hour 30 minutes"; 1 → "1 นาที" / "1 minute". */
export function durationWords(totalMinutes: number, lang: "th" | "en"): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (lang === "th") return [h ? `${h} ชั่วโมง` : "", m || !h ? `${m} นาที` : ""].filter(Boolean).join(" ");
  const hours = h ? `${h} ${h === 1 ? "hour" : "hours"}` : "";
  const mins = m || !h ? `${m} ${m === 1 ? "minute" : "minutes"}` : "";
  return [hours, mins].filter(Boolean).join(" ");
}

/**
 * Makes staff-typed Thai safe for text-to-speech: clock times and "น." become words, "ID" becomes
 * "รหัสนักศึกษา", and slashes become pauses.
 */
export function speakableThai(text: string): string {
  return text
    .replace(/(\d{1,2})[:.](\d{2})\s*(?:น\.)?/g, (_, h: string, m: string) => (Number(m) ? `${Number(h)} นาฬิกา ${Number(m)} นาที` : `${Number(h)} นาฬิกาตรง`))
    .replace(/(\d+)\s*น\./g, "$1 นาฬิกาตรง")
    .replace(/(เลขที่|เลข)?\s*ID\b/gi, " รหัสนักศึกษา")
    .replace(/[\/|]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function fillScript(template: string, context: AnnouncementContext, lang: "th" | "en", mode: "caption" | "speech"): string {
  const remainingMinutes = Math.max(0, Math.ceil((context.endAt - context.now) / 60_000));
  const durationMinutes = Math.round((context.endAt - context.startAt) / 60_000);
  const filled = template
    .replaceAll("{end}", timeText(context.endAt, lang, mode))
    .replaceAll("{start}", timeText(context.startAt, lang, mode))
    .replaceAll("{duration}", durationWords(durationMinutes, lang))
    .replaceAll("{remaining}", durationWords(remainingMinutes, lang))
    .replaceAll("{added}", durationWords(context.addedMinutes ?? 0, lang))
    .replaceAll("{title}", context.title.trim())
    .replaceAll("{room}", context.room.trim())
    .replace(/\s{2,}/g, " ")
    .trim();
  return mode === "speech" && lang === "th" ? speakableThai(filled) : filled;
}

export function scriptFor(id: AnnouncementId, overrides: Partial<Record<AnnouncementId, Bi>>): Bi {
  const custom = overrides[id];
  const fallback = DEFAULT_SCRIPTS[id];
  return { th: custom?.th.trim() || fallback.th, en: custom?.en.trim() || fallback.en };
}

/** Several announcements due at the same second are read as one, in playback order. */
export function combineScripts(ids: AnnouncementId[], overrides: Partial<Record<AnnouncementId, Bi>>): Bi {
  const ordered = ANNOUNCEMENT_ORDER.filter((id) => ids.includes(id)).map((id) => scriptFor(id, overrides));
  return { th: ordered.map((s) => s.th).join(" "), en: ordered.map((s) => s.en).join(" ") };
}

export interface SpokenPart {
  lang: "th" | "en";
  text: string;
}

export function languageOrder(language: VoiceLanguage): ("th" | "en")[] {
  return language === "th" ? ["th"] : language === "en" ? ["en"] : language === "th-en" ? ["th", "en"] : ["en", "th"];
}

/** The parts to speak, in the chosen language order. Empty texts are skipped. */
export function spokenParts(script: Bi, context: AnnouncementContext, language: VoiceLanguage): SpokenPart[] {
  return languageOrder(language)
    .map((lang) => ({ lang, text: fillScript(script[lang], context, lang, "speech") }))
    .filter((part) => part.text.length > 0);
}

export function captionFor(script: Bi, context: AnnouncementContext): Bi {
  return { th: fillScript(script.th, context, "th", "caption"), en: fillScript(script.en, context, "en", "caption") };
}

export interface RuleMinutes {
  lateEntryMinutes: number;
  earlyLeaveMinutes: number;
  lastLeaveMinutes: number;
}

/** Clock times of the rule-based moments for a session; a moment exists only when its rule is set and fits the exam. */
export function momentTimes(session: { startAt: number; endAt: number }, rules: RuleMinutes): { id: MomentId; at: number }[] {
  const total = session.endAt - session.startAt;
  const out: { id: MomentId; at: number }[] = [{ id: "prestart", at: session.startAt - PRESTART_MINUTES * 60_000 }];
  if (rules.lateEntryMinutes > 0 && rules.lateEntryMinutes * 60_000 < total) out.push({ id: "entryClosed", at: session.startAt + rules.lateEntryMinutes * 60_000 });
  const lastFrom = rules.lastLeaveMinutes > 0 ? session.endAt - rules.lastLeaveMinutes * 60_000 : session.endAt;
  if (rules.earlyLeaveMinutes > 0 && session.startAt + rules.earlyLeaveMinutes * 60_000 < lastFrom) {
    out.push({ id: "mayLeave", at: session.startAt + rules.earlyLeaveMinutes * 60_000 });
  }
  if (rules.lastLeaveMinutes > 0 && rules.lastLeaveMinutes * 60_000 < total) out.push({ id: "lastLeave", at: lastFrom });
  return out;
}

/** Rule-based moments whose time falls in (prev, now]. */
export function crossedMoments(session: { startAt: number; endAt: number }, rules: RuleMinutes, prev: number, now: number): MomentId[] {
  if (now <= prev) return [];
  return momentTimes(session, rules)
    .filter((moment) => prev < moment.at && moment.at <= now)
    .map((moment) => moment.id);
}
