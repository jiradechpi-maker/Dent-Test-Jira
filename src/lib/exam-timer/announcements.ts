/**
 * The 5-minute warning shown on the projector (with a chime), for the invigilator to read out. Staff can reword
 * it; an English line for international students is added while the standard wording is used.
 */

import type { Bi } from "@/lib/i18n/locale";

export const ANNOUNCE_AT_MINUTES = 5;

export const FIVE_MINUTE_TEXT = "เหลือเวลาสอบอีก 5 นาที กรุณาตรวจสอบความถูกต้อง และอย่าลืมเขียนชื่อและเลขที่ ID";

const FIVE_MINUTE_TEXT_EN = "5 minutes remaining. Please check your answers, and remember to write your name and student ID.";

/** The text to show; a text box with no words in it (empty, or only spaces and punctuation) falls back to the standard wording. */
export function announcementText(text: string): string {
  return /[\p{L}\p{N}]/u.test(text) ? text.trim() : FIVE_MINUTE_TEXT;
}

/** What the projector shows: the Thai words, plus English when the standard wording is in use. */
export function captionFor(text: string): Bi {
  const th = announcementText(text);
  return { th, en: th === FIVE_MINUTE_TEXT ? FIVE_MINUTE_TEXT_EN : "" };
}
