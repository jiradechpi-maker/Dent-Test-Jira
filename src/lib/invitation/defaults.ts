import { parseIsoDate, todayInBangkok, toBuddhistYear } from "@/lib/thai";
import { invitationSchema, type InvitationInput, type ScheduleItemInput } from "./schema";

/** Thai academic calendar: semester 1 ≈ Aug–Dec, semester 2 ≈ Jan–May, summer ≈ Jun–Jul. */
export function currentAcademicTerm(isoToday: string): { academicYear: number; semester: InvitationInput["semester"] } {
  const d = parseIsoDate(isoToday);
  if (!d) return { academicYear: toBuddhistYear(new Date().getFullYear()), semester: "1" };
  const be = toBuddhistYear(d.year);
  if (d.month >= 8) return { academicYear: be, semester: "1" };
  if (d.month <= 5) return { academicYear: be - 1, semester: "2" };
  return { academicYear: be - 1, semester: "3" };
}

let idCounter = 0;
export function newRowId(): string {
  idCounter += 1;
  return `row-${Date.now().toString(36)}-${idCounter}`;
}

export function emptyScheduleItem(date: string): ScheduleItemInput {
  return { id: newRowId(), date, startTime: "09:00", endTime: "12:00", topic: "", hours: 3 };
}

export function defaultInvitation(today: string = todayInBangkok()): InvitationInput {
  const term = currentAcademicTerm(today);
  return {
    letterNo: "",
    issueDate: today,
    includeIssueDay: false,
    lecturerName: "",
    courseName: "",
    semester: term.semester,
    academicYear: term.academicYear,
    studentYear: 1,
    venue: "",
    coordinatorTitle: "นาย",
    coordinatorName: "จิรเดช พิชัย",
    coordinatorPhone: "",
    coordinatorEmail: "",
    schedule: [emptyScheduleItem(today)],
    includeExamSection: true,
    pointsPerHour: 5,
    examDeadline: "",
    thaiDigits: true,
  };
}

const DRAFT_KEY = "dentops.invitation.draft.v1";

/** Loads the saved draft, merged over defaults so new fields never break old drafts. */
export function loadDraft(): InvitationInput | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<InvitationInput>;
    const base = defaultInvitation();
    const merged: InvitationInput = {
      ...base,
      ...parsed,
      schedule: Array.isArray(parsed.schedule) && parsed.schedule.length > 0 ? parsed.schedule : base.schedule,
    };
    // Shape check only (values may be incomplete — that's what a draft is).
    const shape = invitationSchema.safeParse(merged);
    if (shape.success) return shape.data;
    const typesOk = typeof merged.academicYear === "number" && typeof merged.thaiDigits === "boolean";
    return typesOk ? merged : null;
  } catch {
    return null;
  }
}

export function saveDraft(value: InvitationInput): void {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
  } catch {
    // storage unavailable — drafts are a convenience only
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

/** Remembered coordinator details survive "new letter" resets. */
export function keepCoordinator(from: InvitationInput, into: InvitationInput): InvitationInput {
  return {
    ...into,
    coordinatorTitle: from.coordinatorTitle,
    coordinatorName: from.coordinatorName,
    coordinatorPhone: from.coordinatorPhone,
    coordinatorEmail: from.coordinatorEmail,
    thaiDigits: from.thaiDigits,
  };
}

const BUILDING_55 = "อาคารเฉลิมพระเกียรติ 55 พรรษา สมเด็จพระเทพรัตนราชสุดาฯ สยามบรมราชกุมารี";
const CLINIC_BUILDING = "อาคารคลินิกทันตกรรม";

/** Quick-fill venues. Building 55 has DT01 and DT03 (floor 8); clinic-building floors are not printed. */
export const VENUE_PRESETS: { label: string; value: string }[] = [
  { label: "DT01 · ตึก 55", value: `ห้อง DT01 ชั้น 8 ${BUILDING_55}` },
  { label: "DT03 · ตึก 55", value: `ห้อง DT03 ชั้น 8 ${BUILDING_55}` },
  { label: "Conference room 1 (401)", value: `ห้อง Conference room 1 (401) ${CLINIC_BUILDING}` },
  { label: "Lecture 1", value: `ห้อง Lecture 1 ${CLINIC_BUILDING}` },
  { label: "Lecture 3", value: `ห้อง Lecture 3 ${CLINIC_BUILDING}` },
  { label: "Common Lab 1", value: `ห้อง Common Lab 1 ${CLINIC_BUILDING}` },
  { label: "Common Lab 2", value: `ห้อง Common Lab 2 ${CLINIC_BUILDING}` },
];
