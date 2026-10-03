/**
 * Keeps Thai words from being split across lines.
 *
 * Browsers and LibreOffice break Thai with the ICU dictionary, which splits compound words into
 * pieces ("ทันต|แพทย|ศาสตร|บัณฑิต", "จันทร|มณี"), so a line can end in the middle of a word.
 * `word-break: keep-all` does not help (Chromium ignores it for Thai) and Intl.Segmenter uses the
 * same dictionary. Instead, mark the words that must stay whole: compound terms used in faculty
 * letters plus every token of a person's name. Breaks between words are left to the engine.
 */

/** Compound words that ICU splits but must never be broken in an official letter. */
export const PROTECTED_TERMS = [
  "ทันตแพทยศาสตรบัณฑิต",
  "ทันตแพทยศาสตร์",
  "ทันตแพทย์หญิง",
  "ทันตแพทย์",
  "ผู้ช่วยศาสตราจารย์",
  "รองศาสตราจารย์",
  "ศาสตราจารย์",
  "สถาบัน",
  "เทคโนโลยี",
  "พระจอมเกล้า",
  "เจ้าคุณทหาร",
  "ลาดกระบัง",
  "ฉลองกรุง",
  "กรุงเทพฯ",
  "เฉลิมพระเกียรติ",
  "พรรษา",
  "สมเด็จพระเทพรัตนราชสุดาฯ",
  "สยามบรมราชกุมารี",
  "อาจารย์พิเศษ",
  "อาจารย์ผู้สอน",
  "ประสานงาน",
  "โทรศัพท์",
  "หมายเลข",
  "ภาคการศึกษา",
  "ปีการศึกษา",
  "นักศึกษา",
  "ปริญญาตรี",
  "หลักสูตร",
  "นานาชาติ",
  "รายวิชา",
  "ภาษาอังกฤษ",
  "ประสบการณ์",
  "ความสามารถ",
  "ความรู้",
  "อนุเคราะห์",
  "ขอขอบพระคุณ",
  "ความนับถือ",
  "คณบดี",
  "สนับสนุน",
  "วิชาการ",
  "ดำเนินการ",
  "การเรียนการสอน",
  "รายละเอียด",
  "เอกสาร",
  "มอบหมาย",
] as const;

export interface WrapSegment {
  text: string;
  /** true = must not be broken inside. */
  keep: boolean;
}

const THAI = /[฀-๿]/;

/** Thai tokens of a person's name ("ผู้ช่วยศาสตราจารย์ ดร.ทันตแพทย์อริยะ จันทรมณี" → each part stays whole). */
export function nameTokens(...names: string[]): string[] {
  return names.flatMap((name) => name.split(/\s+/)).filter((token) => token.length > 1 && THAI.test(token));
}

/**
 * Split text into runs, marking every occurrence of a protected term (longest match first).
 * Joining the `text` of all segments gives back the input unchanged.
 */
export function protectThai(text: string, extraTerms: readonly string[] = []): WrapSegment[] {
  const terms = [...new Set([...extraTerms, ...PROTECTED_TERMS])].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!THAI.test(text) || terms.length === 0) return [{ text, keep: false }];

  const segments: WrapSegment[] = [];
  let plain = "";
  let i = 0;
  outer: while (i < text.length) {
    for (const term of terms) {
      if (text.startsWith(term, i)) {
        if (plain) segments.push({ text: plain, keep: false });
        plain = "";
        segments.push({ text: term, keep: true });
        i += term.length;
        continue outer;
      }
    }
    plain += text[i];
    i += 1;
  }
  if (plain) segments.push({ text: plain, keep: false });
  return segments;
}

const WORD_JOINER = "\u2060";
const ZERO_WIDTH_SPACE = "\u200B";
const words = new Intl.Segmenter("th", { granularity: "word" });
const graphemes = new Intl.Segmenter("th", { granularity: "grapheme" });

/**
 * Line-break plan for engines without markup (LibreOffice). Thai text is fully pre-segmented: a WORD
 * JOINER between the grapheme clusters inside each word forbids breaking there, and a ZERO WIDTH SPACE
 * marks every allowed break between words. Protected words count as one word. The engine never has to
 * guess with its own dictionary, so the result matches the browser preview. Text looks unchanged.
 */
export function joinProtected(text: string, extraTerms: readonly string[] = []): string {
  if (!THAI.test(text)) return text;
  const pieces: { text: string; thai: boolean }[] = [];
  for (const segment of protectThai(text, extraTerms)) {
    if (segment.keep) pieces.push({ text: segment.text, thai: true });
    else for (const word of words.segment(segment.text)) pieces.push({ text: word.segment, thai: THAI.test(word.segment) });
  }
  let out = "";
  pieces.forEach((piece, index) => {
    const previous = pieces[index - 1];
    if (previous?.thai && piece.thai) out += ZERO_WIDTH_SPACE;
    out += piece.thai ? [...graphemes.segment(piece.text)].map((g) => g.segment).join(WORD_JOINER) : piece.text;
  });
  return out;
}
