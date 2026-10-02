export interface DocumentTemplateInfo {
  file: string;
  name: string;
  version: string;
  description: string;
  variables: { tag: string; description: string }[];
}

export const DOCUMENT_TEMPLATES: DocumentTemplateInfo[] = [
  {
    file: "invitation-letter.docx",
    name: "หนังสือเชิญอาจารย์พิเศษ + เอกสารแนบตารางสอน",
    version: "v1",
    description: "หนังสือราชการภายนอก 1 หน้า + เอกสารแนบตารางกำหนดการสอนและรายละเอียดการออกข้อสอบ",
    variables: [
      { tag: "{letterNo}", description: "เลขที่หนังสือ (ต่อจาก อว ๗๐๓๓ /)" },
      { tag: "{issueDate}", description: "วันที่ออกหนังสือ" },
      { tag: "{courseName}", description: "ชื่อรายวิชา" },
      { tag: "{lecturerName}", description: "ชื่ออาจารย์พิเศษ" },
      { tag: "{semester} {academicYear} {studentYear}", description: "ภาคการศึกษา ปีการศึกษา ชั้นปี" },
      { tag: "{venue}", description: "สถานที่เรียน" },
      { tag: "{coordinatorShort} {coordinatorFull}", description: "ผู้ประสานงาน (น.ส. / นางสาว)" },
      { tag: "{coordinatorPhone} {coordinatorEmail}", description: "ช่องทางติดต่อผู้ประสานงาน" },
      { tag: "{#schedule}…{/schedule}", description: "แถวตารางสอน: {dayDate} {timeRange} {topic} {hours}" },
      { tag: "{#hasExam}…{/hasExam}", description: "ส่วนรายละเอียดการออกข้อสอบ" },
      { tag: "{pointsPerHour} {totalHours} {totalPoints} {examDeadline}", description: "คะแนนข้อสอบและกำหนดส่ง" },
    ],
  },
];
