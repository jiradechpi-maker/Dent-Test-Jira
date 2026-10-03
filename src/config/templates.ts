import type { Bi } from "@/lib/i18n/locale";

export interface DocumentTemplateInfo {
  file: string;
  name: Bi;
  version: string;
  description: Bi;
  variables: { tag: string; description: Bi }[];
}

export const DOCUMENT_TEMPLATES: DocumentTemplateInfo[] = [
  {
    file: "invitation-letter.docx",
    name: { th: "หนังสือเชิญอาจารย์พิเศษ + เอกสารแนบตารางสอน", en: "Guest lecturer invitation + teaching schedule attachment" },
    version: "v1",
    description: { th: "หนังสือราชการภายนอก 1 หน้า + เอกสารแนบตารางกำหนดการสอนและรายละเอียดการออกข้อสอบ", en: "One-page Thai official letter + attachment with the teaching schedule and exam-question details" },
    variables: [
      { tag: "{letterNo}", description: { th: "เลขที่หนังสือ (ต่อจาก อว ๗๐๓๓ /)", en: "Letter number (after อว ๗๐๓๓ /)" } },
      { tag: "{issueDate}", description: { th: "วันที่ออกหนังสือ", en: "Issue date" } },
      { tag: "{courseName}", description: { th: "ชื่อรายวิชา", en: "Course name" } },
      { tag: "{lecturerName}", description: { th: "ชื่ออาจารย์พิเศษ", en: "Guest lecturer's name" } },
      { tag: "{semester} {academicYear} {studentYear}", description: { th: "ภาคการศึกษา ปีการศึกษา ชั้นปี", en: "Semester, academic year, student year" } },
      { tag: "{venue}", description: { th: "สถานที่เรียน", en: "Venue" } },
      { tag: "{coordinatorShort} {coordinatorFull}", description: { th: "ผู้ประสานงาน (น.ส. / นางสาว)", en: "Coordinator (short / full title)" } },
      { tag: "{coordinatorPhone} {coordinatorEmail}", description: { th: "ช่องทางติดต่อผู้ประสานงาน", en: "Coordinator's contact details" } },
      { tag: "{#schedule}…{/schedule}", description: { th: "แถวตารางสอน: {dayDate} {timeRange} {topic} {hours}", en: "Schedule rows: {dayDate} {timeRange} {topic} {hours}" } },
      { tag: "{#hasExam}…{/hasExam}", description: { th: "ส่วนรายละเอียดการออกข้อสอบ", en: "Exam-question section" } },
      { tag: "{pointsPerHour} {totalHours} {totalPoints} {examDeadline}", description: { th: "คะแนนข้อสอบและกำหนดส่ง", en: "Exam points and deadline" } },
    ],
  },
];
