/**
 * The one spoken announcement: the 5-minute warning, in Thai. Staff can reword it; the screen shows the
 * same words (plus an English line for international students while the standard wording is used).
 */

import type { Bi } from "@/lib/i18n/locale";

export const ANNOUNCE_AT_MINUTES = 5;

export const FIVE_MINUTE_TEXT = "เหลือเวลาสอบอีก 5 นาที กรุณาตรวจสอบความถูกต้อง และอย่าลืมเขียนชื่อและเลขที่ ID";

const FIVE_MINUTE_TEXT_EN = "5 minutes remaining. Please check your answers, and remember to write your name and student ID.";

/** The text to speak and show; an emptied text box falls back to the standard wording. */
export function announcementText(text: string): string {
  return text.trim() || FIVE_MINUTE_TEXT;
}

/** What the projector shows: the Thai words, plus English when the standard wording is in use. */
export function captionFor(text: string): Bi {
  const th = announcementText(text);
  return { th, en: th === FIVE_MINUTE_TEXT ? FIVE_MINUTE_TEXT_EN : "" };
}

/**
 * Makes Thai text easy for a Thai voice to read: clock times and "น." become words, "ID" is spelled the way
 * it is said ("ไอดี"), and slashes become pauses. The screen keeps the original wording.
 */
export function speakableThai(text: string): string {
  return text
    .replace(/(\d{1,2})[:.](\d{2})\s*(?:น\.)?/g, (_, h: string, m: string) => (Number(m) ? `${Number(h)} นาฬิกา ${Number(m)} นาที` : `${Number(h)} นาฬิกาตรง`))
    .replace(/(\d+)\s*น\./g, "$1 นาฬิกาตรง")
    .replace(/\bID\b/gi, "ไอดี")
    .replace(/[/|]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
