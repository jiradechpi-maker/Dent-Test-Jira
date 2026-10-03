/**
 * What candidates must be told before every exam, "ทั้งทางวาจาและลายลักษณ์อักษร" (ข้อ ๑๐): short cards for the
 * projector while candidates take their seats, and the full wording for a printed A4 notice. The content follows
 * the institute's examination regulation (ข้อ ๒–๙); the room rules and the calculator exception come from the
 * exam's own settings.
 */

import type { Bi } from "@/lib/i18n/locale";
import type { RoomRules } from "./room-rules";

export interface StudentRulesSettings {
  /** Show the rule cards on the projector before the exam starts. */
  show: boolean;
  /** The examiner allows calculators (ข้อ ๖: "เว้นแต่ผู้ออกข้อสอบจะระบุอนุญาตไว้"). */
  calculatorAllowed: boolean;
}

export const DEFAULT_STUDENT_RULES: StudentRulesSettings = { show: true, calculatorAllowed: false };

export function normalizeStudentRules(value: unknown): StudentRulesSettings {
  const v = (typeof value === "object" && value !== null ? value : {}) as Partial<StudentRulesSettings>;
  return {
    show: typeof v.show === "boolean" ? v.show : DEFAULT_STUDENT_RULES.show,
    calculatorAllowed: typeof v.calculatorAllowed === "boolean" ? v.calculatorAllowed : DEFAULT_STUDENT_RULES.calculatorAllowed,
  };
}

export type StudentRuleId = "time" | "id-card" | "phone" | "items" | "dress" | "misconduct";

export interface StudentRule {
  id: StudentRuleId;
  title: Bi;
  text: Bi;
}

const leaveText = (minutes: number): Bi => (minutes === 60 ? { th: "1 ชั่วโมง", en: "1 hour" } : { th: `${minutes} นาที`, en: `${minutes} minutes` });

function timeRule(rules: RoomRules): Bi {
  const leave = rules.earlyLeaveMinutes === 60 ? { th: "1 ชั่วโมง", en: "1 hour" } : { th: `${rules.earlyLeaveMinutes} นาที`, en: `${rules.earlyLeaveMinutes} min` };
  const entry = rules.lateEntryMinutes === 0 ? { th: "ห้ามเข้าสาย", en: "No late entry" } : { th: `สายได้ไม่เกิน ${rules.lateEntryMinutes} นาที`, en: `Late entry up to ${rules.lateEntryMinutes} min` };
  return { th: `${entry.th} · ออกได้เมื่อสอบไปแล้ว ${leave.th}`, en: `${entry.en} · leave after ${leave.en}` };
}

/** Six short cards for the projector, in the order candidates meet them — each short enough for two lines. */
export function studentRuleCards(rules: RoomRules, options: StudentRulesSettings): StudentRule[] {
  return [
    { id: "time", title: { th: "เวลาเข้า–ออกห้อง", en: "Entry & leaving" }, text: timeRule(rules) },
    {
      id: "id-card",
      title: { th: "บัตรแสดงตน", en: "ID card" },
      text: { th: "วางบัตรนักศึกษาไว้บนโต๊ะ (หรือบัตรประชาชน / บัตรราชการ)", en: "Student ID card on the desk (or national / official photo ID)" },
    },
    {
      id: "phone",
      title: { th: "โทรศัพท์มือถือ", en: "Phones" },
      text: { th: "ปิดเครื่อง แล้ววางไว้ใต้เก้าอี้ที่นั่งสอบ", en: "Switch off and place under your chair" },
    },
    {
      id: "items",
      title: { th: "สิ่งของต้องห้าม", en: "Prohibited items" },
      text: options.calculatorAllowed
        ? { th: "ห้ามตำรา เอกสาร นาฬิกาอัจฉริยะ · ใช้เครื่องคิดเลขได้", en: "No books, notes or smartwatches · calculators allowed" }
        : { th: "ห้ามนำตำรา เอกสาร เครื่องคิดเลข และนาฬิกาอัจฉริยะเข้าห้อง", en: "No books, notes, calculators or smartwatches" },
    },
    {
      id: "dress",
      title: { th: "การแต่งกาย", en: "Dress code" },
      text: { th: "แต่งกายสุภาพตามระเบียบ ห้ามสวมรองเท้าแตะ", en: "Dress code applies — no sandals or flip-flops" },
    },
    {
      id: "misconduct",
      title: { th: "การทุจริต", en: "Misconduct" },
      text: { th: "ผู้ทุจริตจะถูกสั่งหยุดสอบทันที และรายงานคณบดี", en: "Cheating: stopped at once and reported to the Dean" },
    },
  ];
}

export interface NoticeSection {
  id: StudentRuleId;
  title: Bi;
  items: Bi[];
}

/** The full written notice (A4), section by section, following the regulation's own order. */
export function noticeSections(rules: RoomRules, options: StudentRulesSettings): NoticeSection[] {
  const leave = leaveText(rules.earlyLeaveMinutes);
  const entry: Bi =
    rules.lateEntryMinutes === 0
      ? { th: "ไม่อนุญาตให้เข้าห้องสอบหลังเวลาเริ่มสอบ", en: "No one may enter the room after the exam has started." }
      : {
          th: `ไม่อนุญาตให้เข้าห้องสอบหลังจากเริ่มสอบไปแล้วเกิน ${rules.lateEntryMinutes} นาที`,
          en: `No one may enter the room more than ${rules.lateEntryMinutes} minutes after the exam has started.`,
        };
  return [
    {
      id: "time",
      title: { th: "เวลาเข้า–ออกห้องสอบ", en: "Entering and leaving the room" },
      items: [
        entry,
        {
          th: `ไม่อนุญาตให้ออกจากห้องสอบภายใน ${leave.th}แรก นับจากเวลาเริ่มสอบ เว้นแต่มีเหตุฉุกเฉิน ซึ่งอยู่ในดุลยพินิจของกรรมการคุมสอบ`,
          en: `No one may leave within the first ${rules.earlyLeaveMinutes === 60 ? "hour" : leave.en} of the exam, except in an emergency at the invigilator's discretion.`,
        },
      ],
    },
    {
      id: "id-card",
      title: { th: "บัตรแสดงตนและสิทธิ์เข้าสอบ", en: "Identification and eligibility" },
      items: [
        {
          th: "แสดงบัตรนักศึกษา หากไม่ได้นำมา ให้ใช้บัตรประชาชนหรือบัตรราชการที่มีรูปถ่ายแทน",
          en: "Show your student ID card. If you do not have it, show your national ID card or another official photo ID.",
        },
        {
          th: "ไม่มีบัตรหรือไม่มีรายชื่อ ให้ติดต่อสำนักทะเบียนและประมวลผลทันที เพื่อขอหลักฐานแสดงตนหรือหลักฐานการเข้าสอบ",
          en: "If you have no card or your name is not on the list, contact the Office of the Registrar at once for proof of identity or eligibility.",
        },
        {
          th: "กรรมการคุมสอบอนุญาตให้เข้าสอบเฉพาะนักศึกษาที่มีรายชื่อในการเข้าสอบเท่านั้น",
          en: "Only students named on the examination list may sit the exam.",
        },
      ],
    },
    {
      id: "dress",
      title: { th: "การแต่งกาย", en: "Dress code" },
      items: [
        {
          th: "แต่งกายสุภาพเรียบร้อย ห้ามสวมรองเท้าแตะโดยเด็ดขาด หากฝ่าฝืนจะไม่ได้รับอนุญาตให้เข้าสอบ",
          en: "Dress neatly. Sandals and flip-flops are not allowed; anyone wearing them will not be admitted.",
        },
        { th: "นักศึกษาชาย: สวมเสื้อคอปก และสอดชายเสื้อไว้ในกางเกง", en: "Male students: a collared shirt, tucked in." },
        { th: "นักศึกษาหญิง: สวมกระโปรง (ห้ามสวมกางเกงหรือกระโปรงกางเกง)", en: "Female students: a skirt (not trousers or culottes)." },
      ],
    },
    {
      id: "items",
      title: { th: "สิ่งของและอุปกรณ์สื่อสาร", en: "Items and communication devices" },
      items: [
        options.calculatorAllowed
          ? {
              th: "ห้ามนำตำรา เอกสาร พจนานุกรมอิเล็กทรอนิกส์ นาฬิกาที่คิดเลขหรือถ่ายรูปได้ และไม้บรรทัดที่มีสูตร เข้าห้องสอบ (วิชานี้ผู้ออกข้อสอบอนุญาตให้ใช้เครื่องคิดเลข)",
              en: "Do not bring books, notes, electronic dictionaries, watches that can calculate or take photos, or rulers printed with formulas. (The examiner allows calculators in this exam.)",
            }
          : {
              th: "ห้ามนำตำรา เอกสาร พจนานุกรมอิเล็กทรอนิกส์ เครื่องคิดเลข นาฬิกาที่คิดเลขหรือถ่ายรูปได้ และไม้บรรทัดที่มีสูตร เข้าห้องสอบ เว้นแต่ผู้ออกข้อสอบระบุอนุญาตไว้",
              en: "Do not bring books, notes, electronic dictionaries, calculators, watches that can calculate or take photos, or rulers printed with formulas, unless the examiner allows them.",
            },
        {
          th: "ปิดโทรศัพท์มือถือและอุปกรณ์สื่อสารให้เรียบร้อย และวางไว้ใต้เก้าอี้ที่นั่งสอบเท่านั้น ห้ามนำวิทยุสื่อสารหรือกล้องถ่ายรูปเข้าห้องสอบโดยเด็ดขาด",
          en: "Switch off mobile phones and other communication devices, and keep them under your seat only. Two-way radios and cameras are strictly forbidden.",
        },
        { th: "สถาบันไม่รับผิดชอบต่อทรัพย์สินที่สูญหาย", en: "The Institute is not responsible for lost property." },
      ],
    },
    {
      id: "misconduct",
      title: { th: "การทุจริตในการสอบ", en: "Misconduct" },
      items: [
        {
          th: "ผู้ทุจริตจะถูกกรรมการคุมสอบสั่งให้หยุดสอบและออกจากห้องสอบทันที",
          en: "Anyone caught cheating will be told to stop and leave the room immediately.",
        },
        {
          th: "ผู้ทุจริตต้องลงชื่อรับทราบข้อกล่าวหา หากปฏิเสธ พยานในเหตุการณ์อย่างน้อย 2 คนจะลงชื่อแทน",
          en: "They must sign to acknowledge the allegation; if they refuse, at least two witnesses will sign instead.",
        },
        {
          th: "กรรมการคุมสอบจะรายงานคณบดีหรือผู้รับผิดชอบทันที เพื่อสอบสวนและพิจารณาโทษทางวินัย",
          en: "The case is reported to the Dean at once for investigation and disciplinary action.",
        },
      ],
    },
  ];
}

