/** Seed master data (Phase 1 moves this into PostgreSQL via prisma/seed.ts). */

export type Building = "B55" | "CLINIC";

export const BUILDINGS: Record<Building, { name: string; short: string; years: string }> = {
  B55: { name: "อาคารเฉลิมพระเกียรติ 55 พรรษา (ตึก 55)", short: "ตึก 55", years: "ชั้นปี 1–2" },
  CLINIC: { name: "อาคารคลินิกทันตกรรม", short: "ตึกคลินิก", years: "ชั้นปี 3–5" },
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
  note: string;
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
    note: "ตึกคลินิก · รับได้ทั้งชั้นปี (ไม่เกิน 30 คน) ไม่ต้องแบ่งห้อง",
  },
  {
    id: "dt01-dt03",
    building: "B55",
    rooms: ["DT01", "DT03"],
    split: true,
    invigilators: 4,
    note: "ตึก 55 ชั้น 8 · ปี 1–2 · แบ่งนักศึกษาครึ่งห้อง ห้องละ 2 คน",
  },
  {
    id: "dt01-dt05",
    building: "B55",
    rooms: ["DT01", "DT05"],
    split: true,
    invigilators: 4,
    note: "ตึก 55 ชั้น 8 · ปี 1–2 · แบ่งนักศึกษาครึ่งห้อง ห้องละ 2 คน",
  },
  {
    id: "dt03-dt05",
    building: "B55",
    rooms: ["DT03", "DT05"],
    split: true,
    invigilators: 4,
    note: "ตึก 55 ชั้น 8 · ปี 1–2 · แบ่งนักศึกษาครึ่งห้อง ห้องละ 2 คน",
  },
  {
    id: "lecture1-lecture3",
    building: "CLINIC",
    rooms: ["Lecture 1", "Lecture 3"],
    split: true,
    invigilators: 4,
    note: "ตึกคลินิก · ปี 3–5 · แบ่งนักศึกษาครึ่งห้อง ห้องละ 2 คน",
  },
  {
    id: "lecture1-lab",
    building: "CLINIC",
    rooms: ["Lecture 1", "Common Lab"],
    split: true,
    invigilators: 4,
    note: "ตึกคลินิก · ปี 3–5 · แบ่งนักศึกษาครึ่งห้อง ห้องละ 2 คน",
  },
  {
    id: "lecture3-lab",
    building: "CLINIC",
    rooms: ["Lecture 3", "Common Lab"],
    split: true,
    invigilators: 4,
    note: "ตึกคลินิก · ปี 3–5 · แบ่งนักศึกษาครึ่งห้อง ห้องละ 2 คน",
  },
];

/** Traditional Thai day colours, Sunday-first (matches Date#getDay()). */
export const DAY_COLORS = [
  { short: "อา", name: "อาทิตย์", hex: "#FECACA" },
  { short: "จ", name: "จันทร์", hex: "#FEF08A" },
  { short: "อ", name: "อังคาร", hex: "#FBCFE8" },
  { short: "พ", name: "พุธ", hex: "#BBF7D0" },
  { short: "พฤ", name: "พฤหัสบดี", hex: "#FED7AA" },
  { short: "ศ", name: "ศุกร์", hex: "#BAE6FD" },
  { short: "ส", name: "เสาร์", hex: "#E9D5FF" },
] as const;

export const ROLES = [
  { id: "ADMIN", label: "Admin", description: "จัดการระบบและผู้ใช้ทั้งหมด" },
  { id: "ACADEMIC_OFFICER", label: "Academic Officer", description: "นักวิชาการศึกษา — จัดตาราง ออกเอกสาร จัดคุมสอบ" },
  { id: "DEPARTMENT_HEAD", label: "Department Head", description: "หัวหน้าภาค — อนุมัติและดูรายงาน" },
  { id: "TEACHER", label: "Teacher", description: "อาจารย์ — ดูตาราง ส่งข้อสอบ" },
  { id: "FINANCE", label: "Finance", description: "การเงิน — ดูเอกสารเบิกจ่ายและใบลงเวลา" },
  { id: "VIEWER", label: "Viewer", description: "ดูอย่างเดียว" },
] as const;

export interface YearColor {
  year: number;
  /** What the academic office calls it. */
  label: string;
  /** Tint for chips and row backgrounds. */
  bg: string;
  /** Text on the tint. */
  fg: string;
  /** Solid accent (dots, bars, selected chip). */
  solid: string;
}

/** Cohort colours used in the exam and teaching sheets. Year 6 opens next year; it takes the faculty's own purple (#4F0080). */
export const YEAR_COLORS: YearColor[] = [
  { year: 1, label: "ส้ม / พีช", bg: "#FFE8D6", fg: "#9A3412", solid: "#F4975A" },
  { year: 2, label: "น้ำเงิน", bg: "#DBEAFE", fg: "#1E3A8A", solid: "#2563EB" },
  { year: 3, label: "ชมพูแดงอ่อน", bg: "#FFE1E4", fg: "#9F1239", solid: "#F47C8A" },
  { year: 4, label: "ชมพูเข้ม", bg: "#FCE4F1", fg: "#9D174D", solid: "#D61F7A" },
  { year: 5, label: "เทาดำ", bg: "#E4E4E7", fg: "#18181B", solid: "#3F3F46" },
  { year: 6, label: "ม่วงดอกบัวสุราษฎร์ (สีคณะ)", bg: "#EEE2F8", fg: "#4F0080", solid: "#4F0080" },
];

export function yearColor(year: number | null | undefined): YearColor | null {
  return YEAR_COLORS.find((color) => color.year === year) ?? null;
}
