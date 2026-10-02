import { ORGANIZATION } from "@/config/organization";
import {
  digits,
  formatFullThaiDate,
  formatHours,
  formatLetterDate,
  formatScheduleDay,
  formatTimeRange,
  toArabicDigits,
} from "@/lib/thai";
import type { CoordinatorTitle, InvitationInput } from "./schema";

/** Every value the .docx template consumes. All strings are final, print-ready text. */
export interface InvitationTemplateData {
  documentPrefix: string;
  letterNo: string;
  letterheadLines: { text: string }[];
  issueDate: string;
  courseName: string;
  lecturerName: string;
  semester: string;
  academicYear: string;
  studentYear: string;
  venue: string;
  coordinatorShort: string;
  coordinatorFull: string;
  coordinatorPhone: string;
  coordinatorEmail: string;
  signerName: string;
  signerPosition: string;
  footerUnit: string;
  footerPhone: string;
  schedule: { dayDate: string; timeRange: string; topic: string; hours: string }[];
  hasExam: boolean;
  pointsPerHour: string;
  one: string;
  totalHours: string;
  totalPoints: string;
  examChoices: string;
  examDeadline: string;
}

const SHORT_TITLE: Record<CoordinatorTitle, string> = {
  นาย: "นาย",
  นาง: "นาง",
  นางสาว: "น.ส.",
};

/** Number of blank characters left for the day when the registry office fills it in by hand. */
const BLANK_DAY = "      ";

export function totalScheduleHours(schedule: InvitationInput["schedule"]): number {
  return Math.round(schedule.reduce((sum, item) => sum + item.hours, 0) * 100) / 100;
}

export function buildInvitationTemplateData(input: InvitationInput): InvitationTemplateData {
  const th = input.thaiDigits;
  const d = (value: string | number) => digits(toArabicDigits(String(value)), th);

  const sorted = [...input.schedule].sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date),
  );
  const totalHours = totalScheduleHours(sorted);
  const totalPoints = Math.round(totalHours * input.pointsPerHour * 100) / 100;

  const issueDate = input.includeIssueDay
    ? formatLetterDate(input.issueDate, { includeDay: true, thaiDigits: th })
    : BLANK_DAY + formatLetterDate(input.issueDate, { includeDay: false, thaiDigits: th });

  return {
    documentPrefix: d(ORGANIZATION.documentPrefix),
    letterNo: d(input.letterNo.trim()),
    letterheadLines: ORGANIZATION.letterheadLines.map((text) => ({ text: d(text) })),
    issueDate,
    courseName: input.courseName.trim(),
    lecturerName: input.lecturerName.trim(),
    semester: d(input.semester),
    academicYear: d(input.academicYear),
    studentYear: d(input.studentYear),
    venue: d(input.venue.trim()),
    coordinatorShort: `${SHORT_TITLE[input.coordinatorTitle]}${input.coordinatorName.trim()}`,
    coordinatorFull: `${input.coordinatorTitle}${input.coordinatorName.trim()}`,
    coordinatorPhone: d(input.coordinatorPhone.trim()),
    coordinatorEmail: input.coordinatorEmail.trim(),
    signerName: `(${ORGANIZATION.signer.name})`,
    signerPosition: ORGANIZATION.signer.position,
    footerUnit: ORGANIZATION.footerUnit,
    footerPhone: d(ORGANIZATION.footerPhone),
    schedule: sorted.map((item) => ({
      dayDate: formatScheduleDay(item.date, th),
      timeRange: formatTimeRange(item.startTime, item.endTime, th),
      topic: item.topic.trim(),
      hours: formatHours(item.hours, th),
    })),
    hasExam: input.includeExamSection,
    pointsPerHour: formatHours(input.pointsPerHour, th),
    one: d(1),
    totalHours: formatHours(totalHours, th),
    totalPoints: formatHours(totalPoints, th),
    examChoices: d(5),
    examDeadline: input.includeExamSection ? formatFullThaiDate(input.examDeadline, th) : "",
  };
}

/** Safe, descriptive download name, e.g. "หนังสือเชิญ_Endodontics II_อ.สมชาย.docx". */
export function invitationFileName(input: InvitationInput, ext: "docx" | "pdf"): string {
  const clean = (s: string) => s.replace(/[\\/:*?"<>|\n\r\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  const no = input.letterNo.trim() ? `_${clean(toArabicDigits(input.letterNo))}` : "";
  return `หนังสือเชิญ${no}_${clean(input.courseName)}_${clean(input.lecturerName)}.${ext}`;
}
