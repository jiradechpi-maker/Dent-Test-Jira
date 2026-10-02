import { readFileSync } from "node:fs";
import { join } from "node:path";
import PizZip from "pizzip";
import { describe, expect, it } from "vitest";
import { renderDocx } from "@/server/render-docx";
import { SAMPLE_INVITATION } from "./sample";
import { invitationSchema } from "./schema";
import { buildInvitationTemplateData, invitationFileName } from "./template-data";

function documentText(docx: Buffer): string {
  const xml = new PizZip(docx).file("word/document.xml")?.asText() ?? "";
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

describe("invitation template data", () => {
  it("matches the original letter's wording and numbers", () => {
    const data = buildInvitationTemplateData(invitationSchema.parse(SAMPLE_INVITATION));
    expect(data.documentPrefix).toBe("อว ๗๐๓๓");
    expect(data.coordinatorShort).toBe("น.ส.พิมพ์พิสุทธิ์ สุธรรมราษฎร์");
    expect(data.coordinatorFull).toBe("นางสาวพิมพ์พิสุทธิ์ สุธรรมราษฎร์");
    expect(data.coordinatorPhone).toBe("๐๘๙-๖๑๙๑-๓๒๙");
    expect(data.venue).toContain("ห้อง DT01 ชั้น ๘ อาคารเฉลิมพระเกียรติ ๕๕ พรรษา");
    expect(data.schedule[0]).toEqual({
      dayDate: "อังคารที่ ๒๙/๐๙/๖๙",
      timeRange: "๑๓.๐๐ - ๑๖.๐๐ น.",
      topic: "Physiology of mastication and swallowing",
      hours: "๓",
    });
    expect(data.totalHours).toBe("๖");
    expect(data.totalPoints).toBe("๓๐");
    expect(data.examDeadline).toBe("วันจันทร์ที่ ๑๙ ตุลาคม ๒๕๖๙");
    expect(data.issueDate.trim()).toBe("สิงหาคม ๒๕๖๙");
    expect(data.footerPhone).toBe("โทรศัพท์ ๐ ๒๓๒๙ ๘๐๐๐ ต่อ ๒๑๘๙");
  });

  it("sorts the schedule by date and time", () => {
    const input = invitationSchema.parse({
      ...SAMPLE_INVITATION,
      schedule: [...SAMPLE_INVITATION.schedule].reverse(),
    });
    const data = buildInvitationTemplateData(input);
    expect(data.schedule.map((s) => s.dayDate)).toEqual(["อังคารที่ ๒๙/๐๙/๖๙", "พุธที่ ๓๐/๐๙/๖๙"]);
  });

  it("supports Arabic digits when the switch is off", () => {
    const data = buildInvitationTemplateData(invitationSchema.parse({ ...SAMPLE_INVITATION, thaiDigits: false, letterNo: "311" }));
    expect(data.documentPrefix).toBe("อว 7033");
    expect(data.letterNo).toBe("311");
    expect(data.schedule[0]?.timeRange).toBe("13.00 - 16.00 น.");
  });

  it("requires an exam deadline only when the exam section is shown", () => {
    expect(invitationSchema.safeParse({ ...SAMPLE_INVITATION, examDeadline: "" }).success).toBe(false);
    expect(invitationSchema.safeParse({ ...SAMPLE_INVITATION, examDeadline: "", includeExamSection: false }).success).toBe(true);
  });

  it("builds a safe file name", () => {
    const name = invitationFileName(invitationSchema.parse({ ...SAMPLE_INVITATION, courseName: 'A/B:"C"' }), "docx");
    expect(name).not.toMatch(/[\\/:*?"<>|]/);
    expect(name.endsWith(".docx")).toBe(true);
  });
});

describe("rendered .docx", () => {
  const template = readFileSync(join(process.cwd(), "templates", "invitation-letter.docx"));

  it("contains the exact sentences of the original letter with no leftover tags", () => {
    const docx = renderDocx(template, buildInvitationTemplateData(invitationSchema.parse(SAMPLE_INVITATION)));
    const text = documentText(docx);
    const expected = [
      "ที่ อว ๗๐๓๓ /",
      "สถาบันเทคโนโลยีพระจอมเกล้า",
      "เจ้าคุณทหารลาดกระบัง",
      "เลขที่ ๑ ซอยฉลองกรุง ๑",
      "เขตลาดกระบัง กรุงเทพฯ ๑๐๕๒๐",
      "เรื่อง\tขอเรียนเชิญเป็นอาจารย์พิเศษ รายวิชา Digestive System and Nutrient Function",
      "เรียน\tผู้ช่วยศาสตราจารย์ ดร.ทันตแพทย์อริยะ จันทรมณี",
      "ด้วยคณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง ได้ดำเนินการจัดการเรียนการสอนในรายวิชา Digestive System and Nutrient Function หลักสูตรทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ) ใช้การเรียนการสอนเป็นภาษาอังกฤษ ภาคการศึกษาที่ ๑ ปีการศึกษา ๒๕๖๙ ให้กับนักศึกษาระดับปริญญาตรีชั้นปีที่ ๒ ณ ห้อง DT01 ชั้น ๘ อาคารเฉลิมพระเกียรติ ๕๕ พรรษา สมเด็จพระเทพรัตนราชสุดาฯ สยามบรมราชกุมารี คณะทันตแพทยศาสตร์ นั้น",
      "ในการนี้ คณะทันตแพทยศาสตร์ ขอเรียนเชิญท่านเป็นอาจารย์พิเศษในรายวิชา Digestive System and Nutrient Function ซึ่งท่านเป็นผู้มีความรู้ ความสามารถ และมีประสบการณ์สูง โดยรายละเอียดปรากฏดังเอกสารที่แนบมาพร้อมนี้",
      "ทั้งนี้ คณะทันตแพทยศาสตร์ ขอมอบหมายให้ น.ส.พิมพ์พิสุทธิ์ สุธรรมราษฎร์ เป็นผู้ประสานงาน เบอร์โทรศัพท์ ๐๘๙-๖๑๙๑-๓๒๙ E-mail address: pimpisut.su@kmitl.ac.th",
      "คณะทันตแพทยศาสตร์ หวังว่าจะได้รับความอนุเคราะห์จากท่าน และขอขอบพระคุณมา ณ โอกาสนี้",
      "ขอแสดงความนับถือ",
      "(รองศาสตราจารย์ ดร.ทันตแพทย์หญิงอารยา พงษ์หาญยุทธ)",
      "คณบดีคณะทันตแพทยศาสตร์",
      "ภาคเรียนที่ ๑ ปีการศึกษา ๒๕๖๙",
      "หลักสูตรทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ)",
      "ชื่อวิชา: Digestive System and Nutrient Function",
      "อาจารย์ผู้สอน: ผู้ช่วยศาสตราจารย์ ดร.ทันตแพทย์อริยะ จันทรมณี",
      "วัน/ เวลา",
      "หัวข้อการสอน",
      "จำนวนชั่วโมง",
      "รายละเอียดการออกข้อสอบ",
      "ข้อสอบรายวิชาบรรยาย คิดเป็น (๕ คะแนน/ ๑ ชั่วโมงการสอน)",
      "กรณีสอนบรรยาย ๖ ชั่วโมง รบกวนขอ ๓๐ คะแนน",
      "ท่านสามารถออกข้อสอบได้ทั้งแบบอัตนัย และปรนัย (๕ ตัวเลือก)",
      "- ขอให้จัดส่งข้อสอบภายใน วันจันทร์ที่ ๑๙ ตุลาคม ๒๕๖๙",
      "จัดส่งได้ที่ นางสาวพิมพ์พิสุทธิ์ สุธรรมราษฎร์ ซึ่งเป็นผู้ประสานงาน โดยท่านสามารถติดต่อได้ที่หมายเลขโทรศัพท์ ๐๘๙-๖๑๙๑-๓๒๙ E-mail address: pimpisut.su@kmitl.ac.th",
    ];
    for (const line of expected) expect(text).toContain(line);
    expect(text).not.toMatch(/[{}]/);

    const footer = new PizZip(docx)
      .file(/word\/footer\d*\.xml/)
      .map((f) => f.asText().replace(/<[^>]+>/g, ""))
      .join("\n");
    expect(footer).toContain("คณะทันตแพทยศาสตร์  ส่วนสนับสนุนวิชาการ");
    expect(footer).toContain("โทรศัพท์ ๐ ๒๓๒๙ ๘๐๐๐ ต่อ ๒๑๘๙");
  });

  it("drops the exam section and repeats one table row per teaching session", () => {
    const input = invitationSchema.parse({
      ...SAMPLE_INVITATION,
      includeExamSection: false,
      examDeadline: "",
      schedule: [
        ...SAMPLE_INVITATION.schedule,
        { id: "s3", date: "2026-10-01", startTime: "13:00", endTime: "14:30", topic: "Extra & <special> topic", hours: 1.5 },
      ],
    });
    const text = documentText(renderDocx(template, buildInvitationTemplateData(input)));
    expect(text).not.toContain("รายละเอียดการออกข้อสอบ");
    expect(text).toContain("พฤหัสบดีที่ ๐๑/๑๐/๖๙");
    expect(text).toContain("Extra & <special> topic");
    expect(text).toContain("๑.๕");
  });
});
