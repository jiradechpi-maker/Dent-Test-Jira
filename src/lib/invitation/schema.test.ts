import { describe, expect, it } from "vitest";
import { translator } from "@/lib/i18n/locale";
import { SAMPLE_INVITATION } from "./sample";
import { invitationRequestSchema, invitationSchema, makeInvitationRequestSchema, makeInvitationSchema } from "./schema";

function messageAt(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, path: string) {
  return result.error?.issues.find((issue) => issue.path.join(".") === path)?.message;
}

describe("invitation schema languages", () => {
  const en = makeInvitationSchema(translator("en"));

  it("keeps the Thai messages in the default schema", () => {
    const result = invitationSchema.safeParse({ ...SAMPLE_INVITATION, lecturerName: "", coordinatorEmail: "x" });
    expect(messageAt(result, "lecturerName")).toBe("กรุณากรอกชื่ออาจารย์พิเศษ");
    expect(messageAt(result, "coordinatorEmail")).toBe("อีเมลไม่ถูกต้อง");
  });

  it("builds English messages from an English translator", () => {
    const result = en.safeParse({ ...SAMPLE_INVITATION, lecturerName: "", coordinatorEmail: "x", examDeadline: "" });
    expect(messageAt(result, "lecturerName")).toBe("Please enter the guest lecturer's name");
    expect(messageAt(result, "coordinatorEmail")).toBe("Invalid email address");
    expect(messageAt(result, "examDeadline")).toBe("Please choose the exam submission deadline");
  });

  it("translates the per-session messages", () => {
    const [first] = SAMPLE_INVITATION.schedule;
    const bad = { ...SAMPLE_INVITATION, schedule: [{ ...first!, startTime: "16:00", endTime: "13:00" }] };
    expect(messageAt(invitationSchema.safeParse(bad), "schedule.0.endTime")).toBe("เวลาสิ้นสุดต้องหลังเวลาเริ่ม");
    expect(messageAt(en.safeParse(bad), "schedule.0.endTime")).toBe("The end time must be after the start time");
  });

  it("checks the academic year (stored in B.E.) the same way in both languages", () => {
    const bad = { ...SAMPLE_INVITATION, academicYear: 2026 };
    expect(messageAt(invitationSchema.safeParse(bad), "academicYear")).toBe("ปีการศึกษาไม่ถูกต้อง");
    expect(messageAt(en.safeParse(bad), "academicYear")).toBe("Invalid academic year");
  });

  it("accepts and returns the same data in both languages", () => {
    expect(en.parse(SAMPLE_INVITATION)).toEqual(invitationSchema.parse(SAMPLE_INVITATION));
  });

  it("wraps the form schema in the request schema", () => {
    const request = { format: "pdf", data: { ...SAMPLE_INVITATION, venue: " " } };
    expect(messageAt(invitationRequestSchema.safeParse(request), "data.venue")).toBe("กรุณากรอกสถานที่เรียน");
    expect(messageAt(makeInvitationRequestSchema(translator("en")).safeParse(request), "data.venue")).toBe("Please enter the venue");
  });
});
