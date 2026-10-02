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
  /** Floor both rooms are on; null = not confirmed yet. */
  floor: number | null;
  rooms: string[];
  split: boolean;
  invigilators: number;
  note: string;
}

/**
 * Room options in order of preference. Room 401 holds a whole cohort; every other option is two rooms on
 * the same floor used together, so the cohort does not walk between floors. Names match the invigilation sheet.
 */
export const ROOM_RULES: RoomRule[] = [
  {
    id: "conf401",
    building: "CLINIC",
    floor: 4,
    rooms: ["Conference room 1 (401)"],
    split: false,
    invigilators: 2,
    note: "รับได้ทั้งชั้นปี ไม่ต้องแบ่งห้อง",
  },
  {
    id: "b55",
    building: "B55",
    floor: 8,
    rooms: ["DT01", "DT03"],
    split: true,
    invigilators: 4,
    note: "ชั้น 8 · ใช้คู่กันเสมอ ห้องละ 2 คน",
  },
  {
    id: "lecture13",
    building: "CLINIC",
    floor: null,
    rooms: ["Lecture 1", "Lecture 3"],
    split: true,
    invigilators: 4,
    note: "ชั้นเดียวกัน · ใช้คู่กัน ห้องละ 2 คน",
  },
  {
    id: "classroom-lab",
    building: "CLINIC",
    floor: null,
    rooms: ["Classroom 1", "Common Lab"],
    split: true,
    invigilators: 4,
    note: "ชั้นเดียวกัน · ใช้คู่กัน ห้องละ 2 คน",
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
