import { z } from "zod";
import { parseIsoDate, timeToMinutes } from "@/lib/thai";

const isoDate = z
  .string()
  .trim()
  .refine((v) => parseIsoDate(v) !== null, { message: "กรุณาเลือกวันที่ให้ถูกต้อง" });

const time = z
  .string()
  .trim()
  .refine((v) => timeToMinutes(v) !== null, { message: "รูปแบบเวลาไม่ถูกต้อง (ชช:นน)" });

export const COORDINATOR_TITLES = ["นาย", "นาง", "นางสาว"] as const;
export type CoordinatorTitle = (typeof COORDINATOR_TITLES)[number];

export const SEMESTERS = ["1", "2", "3"] as const;

export const scheduleItemSchema = z
  .object({
    id: z.string().min(1),
    date: isoDate,
    startTime: time,
    endTime: time,
    topic: z.string().trim().min(1, "กรุณากรอกหัวข้อการสอน").max(500, "หัวข้อยาวเกินไป"),
    hours: z.number({ message: "กรุณากรอกจำนวนชั่วโมง" }).positive("จำนวนชั่วโมงต้องมากกว่า 0").max(24, "จำนวนชั่วโมงไม่ถูกต้อง"),
  })
  .superRefine((item, ctx) => {
    const start = timeToMinutes(item.startTime);
    const end = timeToMinutes(item.endTime);
    if (start !== null && end !== null && end <= start) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "เวลาสิ้นสุดต้องหลังเวลาเริ่ม" });
    }
  });

export const invitationSchema = z
  .object({
    letterNo: z
      .string()
      .trim()
      .max(20, "เลขที่หนังสือยาวเกินไป")
      .refine((v) => v === "" || /^[0-9๐-๙/.-]+$/.test(v), { message: "ใช้ได้เฉพาะตัวเลข" }),
    issueDate: isoDate,
    includeIssueDay: z.boolean(),
    lecturerName: z.string().trim().min(1, "กรุณากรอกชื่ออาจารย์พิเศษ").max(200),
    courseName: z.string().trim().min(1, "กรุณากรอกชื่อรายวิชา").max(200),
    semester: z.enum(SEMESTERS),
    academicYear: z
      .number({ message: "กรุณากรอกปีการศึกษา" })
      .int()
      .min(2560, "ปีการศึกษาไม่ถูกต้อง")
      .max(2700, "ปีการศึกษาไม่ถูกต้อง"),
    studentYear: z.number().int().min(1).max(6),
    venue: z.string().trim().min(1, "กรุณากรอกสถานที่เรียน").max(300),
    coordinatorTitle: z.enum(COORDINATOR_TITLES),
    coordinatorName: z.string().trim().min(1, "กรุณากรอกชื่อผู้ประสานงาน").max(120),
    coordinatorPhone: z
      .string()
      .trim()
      .min(1, "กรุณากรอกเบอร์โทรศัพท์")
      .regex(/^[0-9๐-๙\s-]+$/, "ใช้ได้เฉพาะตัวเลขและขีด"),
    coordinatorEmail: z.string().trim().email("อีเมลไม่ถูกต้อง"),
    schedule: z.array(scheduleItemSchema).min(1, "ต้องมีกำหนดการสอนอย่างน้อย 1 คาบ").max(40),
    includeExamSection: z.boolean(),
    pointsPerHour: z.number().positive("ต้องมากกว่า 0").max(100),
    examDeadline: z.string().trim(),
    thaiDigits: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.includeExamSection && parseIsoDate(value.examDeadline) === null) {
      ctx.addIssue({ code: "custom", path: ["examDeadline"], message: "กรุณาเลือกวันกำหนดส่งข้อสอบ" });
    }
  });

export type InvitationInput = z.infer<typeof invitationSchema>;
export type ScheduleItemInput = z.infer<typeof scheduleItemSchema>;

export const documentFormatSchema = z.enum(["docx", "pdf"]);
export type DocumentFormat = z.infer<typeof documentFormatSchema>;

export const invitationRequestSchema = z.object({
  format: documentFormatSchema,
  data: invitationSchema,
});
