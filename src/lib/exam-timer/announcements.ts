/**
 * The one spoken announcement: the 5-minute warning, in Thai. Staff can reword it; the screen shows the
 * same words (plus an English line for international students while the standard wording is used).
 */

import type { Bi } from "@/lib/i18n/locale";

export const ANNOUNCE_AT_MINUTES = 5;

export const FIVE_MINUTE_TEXT = "เหลือเวลาสอบอีก 5 นาที กรุณาตรวจสอบความถูกต้อง และอย่าลืมเขียนชื่อและเลขที่ ID";

const FIVE_MINUTE_TEXT_EN = "5 minutes remaining. Please check your answers, and remember to write your name and student ID.";

/** The text to speak and show; a text box with no words in it (empty, or only spaces and punctuation) falls back to the standard wording. */
export function announcementText(text: string): string {
  return /[\p{L}\p{N}]/u.test(text) ? text.trim() : FIVE_MINUTE_TEXT;
}

/** What the projector shows: the Thai words, plus English when the standard wording is in use. */
export function captionFor(text: string): Bi {
  const th = announcementText(text);
  return { th, en: th === FIVE_MINUTE_TEXT ? FIVE_MINUTE_TEXT_EN : "" };
}

/**
 * Titles and abbreviations a Thai voice would otherwise read letter by letter. Written out with no space after them,
 * so "อ.สมชาย" stays one phrase ("อาจารย์สมชาย"). Longest first, so "ทพญ." wins over "ทพ.".
 */
const ABBREVIATIONS: [string, string][] = [
  ["ผศ.ดร.", "ผู้ช่วยศาสตราจารย์ดอกเตอร์"],
  ["รศ.ดร.", "รองศาสตราจารย์ดอกเตอร์"],
  ["ศ.ดร.", "ศาสตราจารย์ดอกเตอร์"],
  ["ทพญ.", "ทันตแพทย์หญิง"],
  ["ผศ.", "ผู้ช่วยศาสตราจารย์"],
  ["รศ.", "รองศาสตราจารย์"],
  ["ศ.", "ศาสตราจารย์"],
  ["ดร.", "ดอกเตอร์"],
  ["ทพ.", "ทันตแพทย์"],
  ["อ.", "อาจารย์"],
  ["นศ.", "นักศึกษา"],
  ["น.ส.", "นางสาว"],
  ["พ.ศ.", "พุทธศักราช"],
  ["ค.ศ.", "คริสต์ศักราช"],
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Only at the start of a word: "อ." inside "ต่อ." is the end of a sentence, not "อาจารย์". */
const ABBREVIATION = new RegExp(`(?<![\\u0E01-\\u0E4E])(${ABBREVIATIONS.map(([short]) => escapeRegExp(short)).join("|")})`, "g");

const clock = (match: string, h: string, m: string) => {
  if (Number(h) > 24) return match;
  return Number(m) ? `${Number(h)} นาฬิกา ${Number(m)} นาที` : `${Number(h)} นาฬิกาตรง`;
};

/**
 * Makes Thai text easy for a Thai voice to read: Thai digits become 0–9, clock times and "น." become words,
 * titles such as "อ." and "ผศ.ดร." are written out, "ID" is spelled the way it is said ("ไอดี"), and slashes
 * become pauses. "12:30", "12.30 น." and "เวลา 12.30" are times; a bare "1.50" stays a number. The screen keeps
 * the original wording.
 */
export function speakableThai(text: string): string {
  return text
    .replace(/[๐-๙]/g, (d) => String(d.charCodeAt(0) - 0x0e50))
    .replace(/(?<!\d)(\d{1,2}):([0-5]\d)(?!\d)(?:\s*น\.)?/g, clock)
    .replace(/(?<!\d)(\d{1,2})\.([0-5]\d)\s*น\./g, clock)
    .replace(/(?<=(?:เวลา|ถึง|ตั้งแต่)\s*)(\d{1,2})\.([0-5]\d)(?!\d)/g, clock)
    .replace(/(\d+)\s*น\./g, "$1 นาฬิกาตรง")
    .replace(ABBREVIATION, (short: string) => ABBREVIATIONS.find(([s]) => s === short)![1])
    .replace(/\bID\b/gi, "ไอดี")
    .replace(/[/|]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const UNIT = /^(นาที|ชั่วโมง|นาฬิกา|นาฬิกาตรง|วินาที|ครั้ง|ข้อ|หน้า|แผ่น|คน|ชุด|คะแนน|บาท)$/;

/** Short words that open a new phrase ("และ เขียนชื่อ") rather than end the previous one — except "ข้อ" after a number ("10 ข้อ"). */
const STARTER = /^(และ|หรือ|แต่|ข้อ|ห้าม|อย่า|โปรด|ถ้า|หาก|เมื่อ|ส่วน|จึง|แล้ว|ซึ่ง)$/;

/**
 * Where a phrase must end: commas, semicolons, ! and ?, new lines, "..." and a full stop that ends a sentence.
 * A dot inside "1.50" or after a short abbreviation such as "อ." or "ดร." is not a full stop.
 */
const SENTENCE_BREAK = /[,;!?\n…]+|\.{2,}|(?<=[^\s.]{4,})\.(?=\s|$)/;

const LATIN_END = /[A-Za-z]$/;
const LATIN_START = /^[A-Za-z]/;

/**
 * Splits Thai text into the phrases a person would say in one breath, so the voice can pause between them.
 * Thai marks phrase breaks with spaces, but a space also separates a number from its unit ("อีก 5 นาที"),
 * short words like "ไอดี" and English words ("Answer Sheet") — those stay with their phrase.
 */
export function thaiPhrases(text: string): string[] {
  const phrases: string[] = [];
  for (const sentence of text.split(SENTENCE_BREAK)) {
    let current: string[] = [];
    for (const token of sentence.trim().split(/\s+/).filter(Boolean)) {
      const previous = current.at(-1);
      const joins =
        previous !== undefined &&
        !(STARTER.test(token) && !/\d$/.test(previous)) &&
        (/^\d/.test(token) ||
          UNIT.test(token) ||
          (/\d$/.test(previous) && token.length <= 6) ||
          (LATIN_END.test(previous) && LATIN_START.test(token)) ||
          token.length <= 4 ||
          current.join(" ").length <= 4);
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
