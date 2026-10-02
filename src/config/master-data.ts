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

export interface RoomRule {
  id: string;
  building: Building;
  rooms: string[];
  split: boolean;
  invigilators: number;
  note: string;
}

export const ROOM_RULES: RoomRule[] = [
  {
    id: "b55",
    building: "B55",
    rooms: ["DT01", "DT03", "DT05"],
    split: true,
    invigilators: 4,
    note: "แบ่ง 2 ห้องเสมอ ห้องละ 2 คน",
  },
  {
    id: "conf401",
    building: "CLINIC",
    rooms: ["Conference room 1 (401)"],
    split: false,
    invigilators: 2,
    note: "รับได้ทั้งชั้นปี ไม่แบ่งห้อง",
  },
  {
    id: "lecture13",
    building: "CLINIC",
    rooms: ["Lecture 1", "Lecture 3"],
    split: true,
    invigilators: 4,
    note: "ใช้คู่กัน แบ่ง 2 ห้อง ห้องละ 2 คน",
  },
  {
    id: "lab12",
    building: "CLINIC",
    rooms: ["Common Lab 1", "Common Lab 2"],
    split: true,
    invigilators: 4,
    note: "ใช้คู่กัน แบ่ง 2 ห้อง ห้องละ 2 คน",
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
