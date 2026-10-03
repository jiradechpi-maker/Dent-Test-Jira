import { z } from "zod";
import { translator, type Translator } from "@/lib/i18n/locale";
import { parseIsoDate, timeToMinutes } from "@/lib/thai";

export const COORDINATOR_TITLES = ["นาย", "นาง", "นางสาว"] as const;
export type CoordinatorTitle = (typeof COORDINATOR_TITLES)[number];

export const SEMESTERS = ["1", "2", "3"] as const;

function isoDate(t: Translator) {
  return z
    .string()
    .trim()
    .refine((v) => parseIsoDate(v) !== null, { message: t("กรุณาเลือกวันที่ให้ถูกต้อง", "Please choose a valid date") });
}

function time(t: Translator) {
  return z
    .string()
    .trim()
    .refine((v) => timeToMinutes(v) !== null, { message: t("รูปแบบเวลาไม่ถูกต้อง (ชช:นน)", "Invalid time (HH:MM)") });
}

/** One teaching session. Validation messages follow the viewer's language; the data itself never changes. */
export function makeScheduleItemSchema(t: Translator) {
  return z
    .object({
      id: z.string().min(1),
      date: isoDate(t),
      startTime: time(t),
      endTime: time(t),
      topic: z
        .string()
        .trim()
        .min(1, t("กรุณากรอกหัวข้อการสอน", "Please enter the teaching topic"))
        .max(500, t("หัวข้อยาวเกินไป", "The topic is too long")),
      hours: z
        .number({ message: t("กรุณากรอกจำนวนชั่วโมง", "Please enter the number of hours") })
        .positive(t("จำนวนชั่วโมงต้องมากกว่า 0", "Hours must be greater than 0"))
        .max(24, t("จำนวนชั่วโมงไม่ถูกต้อง", "Invalid number of hours")),
      /** Exam points this session asks for; absent = hours × points-per-hour. 0 = not a lecture (e.g. a lab). */
      examPoints: z
        .number({ message: t("กรุณากรอกคะแนน", "Please enter the points") })
        .min(0, t("คะแนนติดลบไม่ได้", "Points cannot be negative"))
        .max(500, t("คะแนนมากเกินไป", "Too many points"))
        .optional(),
      /** true once the user typed their own points, so changing the hours no longer recalculates them. */
      examPointsEdited: z.boolean().optional(),
    })
    .superRefine((item, ctx) => {
      const start = timeToMinutes(item.startTime);
      const end = timeToMinutes(item.endTime);
      if (start !== null && end !== null && end <= start) {
        ctx.addIssue({ code: "custom", path: ["endTime"], message: t("เวลาสิ้นสุดต้องหลังเวลาเริ่ม", "The end time must be after the start time") });
      }
    });
}

/**
 * The invitation form. Build it with the viewer's translator so validation messages appear in their
 * language; `invitationSchema` (Thai messages) is the default for the server and for types.
 */
export function makeInvitationSchema(t: Translator) {
  return z
    .object({
      letterNo: z
        .string()
        .trim()
        .max(20, t("เลขที่หนังสือยาวเกินไป", "The letter number is too long"))
        .refine((v) => v === "" || /^[0-9๐-๙/.-]+$/.test(v), { message: t("ใช้ได้เฉพาะตัวเลข", "Digits only") }),
      issueDate: isoDate(t),
      includeIssueDay: z.boolean(),
      lecturerName: z.string().trim().min(1, t("กรุณากรอกชื่ออาจารย์พิเศษ", "Please enter the guest lecturer's name")).max(200),
      courseName: z.string().trim().min(1, t("กรุณากรอกชื่อรายวิชา", "Please enter the course name")).max(200),
      semester: z.enum(SEMESTERS),
      academicYear: z
        .number({ message: t("กรุณากรอกปีการศึกษา", "Please enter the academic year") })
        .int()
        .min(2560, t("ปีการศึกษาไม่ถูกต้อง", "Invalid academic year"))
        .max(2700, t("ปีการศึกษาไม่ถูกต้อง", "Invalid academic year")),
      studentYear: z.number().int().min(1).max(6),
      venue: z.string().trim().min(1, t("กรุณากรอกสถานที่เรียน", "Please enter the venue")).max(300),
      coordinatorTitle: z.enum(COORDINATOR_TITLES),
      coordinatorName: z.string().trim().min(1, t("กรุณากรอกชื่อผู้ประสานงาน", "Please enter the coordinator's name")).max(120),
      coordinatorPhone: z
        .string()
        .trim()
        .min(1, t("กรุณากรอกเบอร์โทรศัพท์", "Please enter a phone number"))
        .regex(/^[0-9๐-๙\s-]+$/, t("ใช้ได้เฉพาะตัวเลขและขีด", "Digits and hyphens only")),
      coordinatorEmail: z.string().trim().email(t("อีเมลไม่ถูกต้อง", "Invalid email address")),
      schedule: z
        .array(makeScheduleItemSchema(t))
        .min(1, t("ต้องมีกำหนดการสอนอย่างน้อย 1 คาบ", "Add at least one teaching session"))
        .max(40),
      includeExamSection: z.boolean(),
      pointsPerHour: z.number().positive(t("ต้องมากกว่า 0", "Must be greater than 0")).max(100),
      examDeadline: z.string().trim(),
      thaiDigits: z.boolean(),
    })
    .superRefine((value, ctx) => {
      if (value.includeExamSection && parseIsoDate(value.examDeadline) === null) {
        ctx.addIssue({
          code: "custom",
          path: ["examDeadline"],
          message: t("กรุณาเลือกวันกำหนดส่งข้อสอบ", "Please choose the exam submission deadline"),
        });
      }
    });
}

export type InvitationSchema = ReturnType<typeof makeInvitationSchema>;

const thai = translator("th");
export const scheduleItemSchema = makeScheduleItemSchema(thai);
export const invitationSchema: InvitationSchema = makeInvitationSchema(thai);

export type InvitationInput = z.infer<typeof invitationSchema>;
export type ScheduleItemInput = z.infer<typeof scheduleItemSchema>;

export const documentFormatSchema = z.enum(["docx", "pdf"]);
export type DocumentFormat = z.infer<typeof documentFormatSchema>;

export function makeInvitationRequestSchema(t: Translator) {
  return z.object({
    format: documentFormatSchema,
    data: makeInvitationSchema(t),
  });
}

export const invitationRequestSchema = makeInvitationRequestSchema(thai);
