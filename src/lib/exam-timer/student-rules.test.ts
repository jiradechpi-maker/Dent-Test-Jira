import { describe, expect, it } from "vitest";
import { REGULATION_RULES } from "./room-rules";
import { DEFAULT_STUDENT_RULES, noticeSections, normalizeStudentRules, studentRuleCards } from "./student-rules";

describe("rules for students", () => {
  it("asks for an official card, as the regulation does", () => {
    const id = studentRuleCards(REGULATION_RULES, DEFAULT_STUDENT_RULES).find((c) => c.id === "id-card")!;
    expect(id.text.th).toContain("บัตรราชการ");
    expect(id.text.en).toContain("official photo ID");
  });

  it("shows six cards on the projector, with this exam's door rules", () => {
    const cards = studentRuleCards(REGULATION_RULES, DEFAULT_STUDENT_RULES);
    expect(cards.map((c) => c.id)).toEqual(["time", "id-card", "phone", "items", "dress", "misconduct"]);
    expect(cards[0]!.text.th).toBe("สายได้ไม่เกิน 30 นาที · ออกได้เมื่อสอบไปแล้ว 1 ชั่วโมง");
    expect(studentRuleCards({ lateEntryMinutes: 0, earlyLeaveMinutes: 30 }, DEFAULT_STUDENT_RULES)[0]!.text).toEqual({
      th: "ห้ามเข้าสาย · ออกได้เมื่อสอบไปแล้ว 30 นาที",
      en: "No late entry · leave after 30 min",
    });
  });

  it("follows the examiner's calculator decision", () => {
    const items = (calculatorAllowed: boolean) => studentRuleCards(REGULATION_RULES, { show: true, calculatorAllowed }).find((c) => c.id === "items")!;
    expect(items(false).text.th).toContain("เครื่องคิดเลข");
    expect(items(false).text.th).not.toContain("อนุญาต");
    expect(items(true).text.th).toContain("ใช้เครื่องคิดเลขได้");
    expect(items(true).text.en).toContain("calculators allowed");
    // Allowing calculators does not lift the ban on watches (ข้อ ๖).
    expect(items(true).text.th).toContain("นาฬิกา");
    expect(items(true).text.en).toContain("smartwatches");
    const printed = (calculatorAllowed: boolean) => noticeSections(REGULATION_RULES, { show: true, calculatorAllowed }).find((s) => s.id === "items")!.items[0]!;
    expect(printed(false).th).toContain("เว้นแต่ผู้ออกข้อสอบระบุอนุญาตไว้");
    expect(printed(true).en).toContain("allows calculators");
  });

  it("prints the regulation section by section in Thai and English", () => {
    const sections = noticeSections(REGULATION_RULES, DEFAULT_STUDENT_RULES);
    expect(sections.map((s) => s.id)).toEqual(["time", "id-card", "dress", "items", "misconduct"]);
    expect(sections[0]!.items.map((i) => i.th)).toEqual([
      "ไม่อนุญาตให้เข้าห้องสอบหลังจากเริ่มสอบไปแล้วเกิน 30 นาที",
      "ไม่อนุญาตให้ออกจากห้องสอบภายใน 1 ชั่วโมงแรก นับจากเวลาเริ่มสอบ เว้นแต่มีเหตุฉุกเฉิน ซึ่งอยู่ในดุลยพินิจของกรรมการคุมสอบ",
    ]);
    expect(sections[0]!.items[1]!.en).toContain("within the first hour");
    expect(noticeSections({ lateEntryMinutes: 15, earlyLeaveMinutes: 30 }, DEFAULT_STUDENT_RULES)[0]!.items[1]!.en).toContain("within the first 30 minutes");
    for (const section of sections) for (const item of section.items) expect(item.en.length).toBeGreaterThan(10);
  });

  it("repairs saved settings", () => {
    expect(normalizeStudentRules(null)).toEqual(DEFAULT_STUDENT_RULES);
    expect(normalizeStudentRules({ show: false, calculatorAllowed: "yes" })).toEqual({ show: false, calculatorAllowed: false });
  });
});
