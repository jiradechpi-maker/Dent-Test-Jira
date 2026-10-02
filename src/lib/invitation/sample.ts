import type { InvitationInput } from "./schema";

/** Realistic sample (taken from the faculty's original letter) — used for previews, tests and docs. */
export const SAMPLE_INVITATION: InvitationInput = {
  letterNo: "",
  issueDate: "2026-08-01",
  includeIssueDay: false,
  lecturerName: "ผู้ช่วยศาสตราจารย์ ดร.ทันตแพทย์อริยะ จันทรมณี",
  courseName: "Digestive System and Nutrient Function",
  semester: "1",
  academicYear: 2569,
  studentYear: 2,
  venue: "ห้อง DT01 ชั้น 8 อาคารเฉลิมพระเกียรติ 55 พรรษา สมเด็จพระเทพรัตนราชสุดาฯ สยามบรมราชกุมารี",
  coordinatorTitle: "นางสาว",
  coordinatorName: "พิมพ์พิสุทธิ์ สุธรรมราษฎร์",
  coordinatorPhone: "089-6191-329",
  coordinatorEmail: "pimpisut.su@kmitl.ac.th",
  schedule: [
    {
      id: "s1",
      date: "2026-09-29",
      startTime: "13:00",
      endTime: "16:00",
      topic: "Physiology of mastication and swallowing",
      hours: 3,
    },
    {
      id: "s2",
      date: "2026-09-30",
      startTime: "09:00",
      endTime: "12:00",
      topic:
        "Clinical correlation: mastication/ swallowing/ salivary gland (elderly with swallowing problem and decrease salivation/ Case discussion/ Student’s presentation and discussion",
      hours: 3,
    },
  ],
  includeExamSection: true,
  pointsPerHour: 5,
  examDeadline: "2026-10-19",
  thaiDigits: true,
};
