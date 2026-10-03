/** Seed master data (Phase 1 moves this into PostgreSQL via prisma/seed.ts). */

import type { Bi } from "@/lib/i18n/locale";

export type Building = "B55" | "CLINIC";

export const BUILDINGS: Record<Building, { name: Bi; short: Bi; years: Bi }> = {
  B55: {
    name: { th: "อาคารเฉลิมพระเกียรติ 55 พรรษา (ตึก 55)", en: "55th Anniversary Building (Building 55)" },
    short: { th: "ตึก 55", en: "Building 55" },
    years: { th: "ชั้นปี 1–2", en: "Years 1–2" },
  },
  CLINIC: {
    name: { th: "อาคารคลินิกทันตกรรม", en: "Dental Clinic Building" },
    short: { th: "ตึกคลินิก", en: "Clinic Building" },
    years: { th: "ชั้นปี 3–5", en: "Years 3–5" },
  },
};

export interface Invigilator {
  nickname: string;
  building: Building;
  /** Building-55 staff get location priority there (score −1000) and a penalty elsewhere (+500). */
  priority: boolean;
}

const B55_PRIORITY = new Set(["Aom", "Pao", "Time"]);

export const INVIGILATORS: Invigilator[] = [
  "Mors",
  "Earth",
  "Pik",
  "Time",
  "Pao",
  "Job",
  "Thunwa",
  "Jane",
  "Ploy",
  "Khat",
  "Thai",
  "Ko",
  "Pim",
  "Nurse",
  "Aom",
  "Namtan",
  "Bank",
  "Ball",
  "Nortor",
].map((nickname) => ({
  nickname,
  building: B55_PRIORITY.has(nickname) ? "B55" : "CLINIC",
  priority: B55_PRIORITY.has(nickname),
}));

/** Former invigilators: kept in the hours history, never suggested for new exams. */
export const RESIGNED_INVIGILATORS = ["Oil", "Jeab"];

/** Main building for a cohort's exams: years 1–2 sit in building 55, years 3+ in the clinic building. */
export function buildingForYear(year: number | null): Building {
  return year !== null && year <= 2 ? "B55" : "CLINIC";
}

export interface RoomRule {
  id: string;
  building: Building;
  rooms: string[];
  split: boolean;
  invigilators: number;
  note: Bi;
}

/**
 * Room options in order of preference. Room 401 holds a whole cohort (≤ 30 students). Every other option is
 * two rooms in one building used together, half the cohort in each. Names match the invigilation sheet.
 */
export const ROOM_RULES: RoomRule[] = [
  {
    id: "conf401",
    building: "CLINIC",
    rooms: ["Conference room 1 (401)"],
    split: false,
    invigilators: 2,
    note: { th: "ตึกคลินิก · รับได้ทั้งชั้นปี (ไม่เกิน 30 คน) ไม่ต้องแบ่งห้อง", en: "Clinic Building · seats a whole cohort (up to 30), no split" },
  },
  {
    id: "dt01-dt03",
    building: "B55",
    rooms: ["DT01", "DT03"],
    split: true,
    invigilators: 4,
    note: { th: "ตึก 55 ชั้น 8 · ปี 1–2 · แบ่งนักศึกษาครึ่งห้อง ห้องละ 2 คน", en: "Building 55, 8th floor · Years 1–2 · cohort split in half, 2 invigilators per room" },
  },
  {
    id: "dt01-dt05",
    building: "B55",
    rooms: ["DT01", "DT05"],
    split: true,
    invigilators: 4,
    note: { th: "ตึก 55 ชั้น 8 · ปี 1–2 · แบ่งนักศึกษาครึ่งห้อง ห้องละ 2 คน", en: "Building 55, 8th floor · Years 1–2 · cohort split in half, 2 invigilators per room" },
  },
  {
    id: "dt03-dt05",
    building: "B55",
    rooms: ["DT03", "DT05"],
    split: true,
    invigilators: 4,
    note: { th: "ตึก 55 ชั้น 8 · ปี 1–2 · แบ่งนักศึกษาครึ่งห้อง ห้องละ 2 คน", en: "Building 55, 8th floor · Years 1–2 · cohort split in half, 2 invigilators per room" },
  },
  {
    id: "lecture1-lecture3",
    building: "CLINIC",
    rooms: ["Lecture 1", "Lecture 3"],
    split: true,
    invigilators: 4,
    note: { th: "ตึกคลินิก · ปี 3–5 · แบ่งนักศึกษาครึ่งห้อง ห้องละ 2 คน", en: "Clinic Building · Years 3–5 · cohort split in half, 2 invigilators per room" },
  },
  {
    id: "lecture1-lab",
    building: "CLINIC",
    rooms: ["Lecture 1", "Common Lab"],
    split: true,
    invigilators: 4,
    note: { th: "ตึกคลินิก · ปี 3–5 · แบ่งนักศึกษาครึ่งห้อง ห้องละ 2 คน", en: "Clinic Building · Years 3–5 · cohort split in half, 2 invigilators per room" },
  },
  {
    id: "lecture3-lab",
    building: "CLINIC",
    rooms: ["Lecture 3", "Common Lab"],
    split: true,
    invigilators: 4,
    note: { th: "ตึกคลินิก · ปี 3–5 · แบ่งนักศึกษาครึ่งห้อง ห้องละ 2 คน", en: "Clinic Building · Years 3–5 · cohort split in half, 2 invigilators per room" },
  },
];

/** Traditional Thai day colours, Sunday-first (matches Date#getDay()). */
export const DAY_COLORS: readonly { short: Bi; name: Bi; hex: string }[] = [
  { short: { th: "อา", en: "Sun" }, name: { th: "อาทิตย์", en: "Sunday" }, hex: "#FECACA" },
  { short: { th: "จ", en: "Mon" }, name: { th: "จันทร์", en: "Monday" }, hex: "#FEF08A" },
  { short: { th: "อ", en: "Tue" }, name: { th: "อังคาร", en: "Tuesday" }, hex: "#FBCFE8" },
  { short: { th: "พ", en: "Wed" }, name: { th: "พุธ", en: "Wednesday" }, hex: "#BBF7D0" },
  { short: { th: "พฤ", en: "Thu" }, name: { th: "พฤหัสบดี", en: "Thursday" }, hex: "#FED7AA" },
  { short: { th: "ศ", en: "Fri" }, name: { th: "ศุกร์", en: "Friday" }, hex: "#BAE6FD" },
  { short: { th: "ส", en: "Sat" }, name: { th: "เสาร์", en: "Saturday" }, hex: "#E9D5FF" },
];

export const ROLES = [
  { id: "ADMIN", label: "Admin", description: { th: "จัดการระบบและผู้ใช้ทั้งหมด", en: "Manages the system and all users" } },
  {
    id: "ACADEMIC_OFFICER",
    label: "Academic Officer",
    description: { th: "นักวิชาการศึกษา — จัดตาราง ออกเอกสาร จัดคุมสอบ", en: "Schedules teaching, issues documents, arranges invigilation" },
  },
  { id: "DEPARTMENT_HEAD", label: "Department Head", description: { th: "หัวหน้าภาค — อนุมัติและดูรายงาน", en: "Approves and reviews reports" } },
  { id: "TEACHER", label: "Teacher", description: { th: "อาจารย์ — ดูตาราง ส่งข้อสอบ", en: "Views timetables, submits exam papers" } },
  { id: "FINANCE", label: "Finance", description: { th: "การเงิน — ดูเอกสารเบิกจ่ายและใบลงเวลา", en: "Views payment documents and time sheets" } },
  { id: "VIEWER", label: "Viewer", description: { th: "ดูอย่างเดียว", en: "Read-only" } },
] as const satisfies readonly { id: string; label: string; description: Bi }[];

export interface YearColor {
  year: number;
  /** What the academic office calls it. */
  label: Bi;
  /** Tint for chips and row backgrounds. */
  bg: string;
  /** Text on the tint. */
  fg: string;
  /** Solid accent (dots, bars, selected chip). */
  solid: string;
}

/** Cohort colours used in the exam and teaching sheets. Year 6 opens next year; it takes the faculty's own purple (#4F0080). */
export const YEAR_COLORS: YearColor[] = [
  { year: 1, label: { th: "ส้ม / พีช", en: "Orange / peach" }, bg: "#FFE8D6", fg: "#9A3412", solid: "#F4975A" },
  { year: 2, label: { th: "น้ำเงิน", en: "Blue" }, bg: "#DBEAFE", fg: "#1E3A8A", solid: "#2563EB" },
  { year: 3, label: { th: "ชมพูแดงอ่อน", en: "Light coral pink" }, bg: "#FFE1E4", fg: "#9F1239", solid: "#F47C8A" },
  { year: 4, label: { th: "ชมพูเข้ม", en: "Deep pink" }, bg: "#FCE4F1", fg: "#9D174D", solid: "#D61F7A" },
  { year: 5, label: { th: "เทาดำ", en: "Charcoal" }, bg: "#E4E4E7", fg: "#18181B", solid: "#3F3F46" },
  { year: 6, label: { th: "ม่วงดอกบัวสุราษฎร์ (สีคณะ)", en: "Faculty purple" }, bg: "#EEE2F8", fg: "#4F0080", solid: "#4F0080" },
];

export function yearColor(year: number | null | undefined): YearColor | null {
  return YEAR_COLORS.find((color) => color.year === year) ?? null;
}
