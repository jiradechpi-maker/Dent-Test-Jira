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

const UNIT = /^(นาที|ชั่วโมง|นาฬิกา|นาฬิกาตรง|วินาที|ครั้ง|ข้อ|หน้า|แผ่น|คน|ชุด)$/;

/**
 * Splits Thai text into the phrases a person would say in one breath, so the voice can pause between them.
 * Thai marks phrase breaks with spaces, but a space also separates a number from its unit ("อีก 5 นาที") and
 * short words like "ไอดี" — those stay with their phrase. Commas, full stops and new lines always break.
 */
export function thaiPhrases(text: string): string[] {
  const phrases: string[] = [];
  for (const sentence of text.split(/[,;!?\n]+|(?<!\d)\.(?!\d)/)) {
    let current: string[] = [];
    for (const token of sentence.trim().split(/\s+/).filter(Boolean)) {
      const previous = current.at(-1);
      const joins =
        previous !== undefined && (/^\d/.test(token) || /\d$/.test(previous) || UNIT.test(token) || token.length <= 4 || current.join(" ").length <= 4);
      if (!current.length || joins) {
        current.push(token);
      } else {
        phrases.push(current.join(" "));
        current = [token];
      }
    }
    if (current.length) phrases.push(current.join(" "));
  }
  return phrases;
}

