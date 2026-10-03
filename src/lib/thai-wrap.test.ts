import { describe, expect, it } from "vitest";
import { joinProtected, nameTokens, protectThai } from "./thai-wrap";

describe("protectThai", () => {
  it("marks compound words and leaves the rest breakable, without changing the text", () => {
    const text = "หลักสูตรทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ) ใช้การเรียนการสอน";
    const segments = protectThai(text);
    expect(segments.map((s) => s.text).join("")).toBe(text);
    expect(segments.filter((s) => s.keep).map((s) => s.text)).toEqual([
      "หลักสูตร",
      "ทันตแพทยศาสตรบัณฑิต",
      "หลักสูตร",
      "นานาชาติ",
      "การเรียนการสอน",
    ]);
  });

  it("prefers the longest term", () => {
    expect(protectThai("คณะทันตแพทยศาสตร์")).toEqual([
      { text: "คณะ", keep: false },
      { text: "ทันตแพทยศาสตร์", keep: true },
    ]);
  });

  it("keeps each part of a person's name whole", () => {
    const tokens = nameTokens("ผู้ช่วยศาสตราจารย์ ดร.ทันตแพทย์อริยะ จันทรมณี");
    expect(tokens).toEqual(["ผู้ช่วยศาสตราจารย์", "ดร.ทันตแพทย์อริยะ", "จันทรมณี"]);
    expect(protectThai("เรียน จันทรมณี", tokens).at(-1)).toEqual({ text: "จันทรมณี", keep: true });
  });

  it("leaves non-Thai text alone", () => {
    expect(protectThai("jiradech.pi@kmitl.ac.th")).toEqual([{ text: "jiradech.pi@kmitl.ac.th", keep: false }]);
  });
});

describe("joinProtected", () => {
  it("allows breaks only between words and never splits a grapheme cluster", () => {
    const out = joinProtected("เบอร์โทรศัพท์");
    expect(out.replace(/[\u2060\u200B]/g, "")).toBe("เบอร์โทรศัพท์");
    // never between a consonant and its combining mark
    expect(out).not.toMatch(/⁠[ัิ-ฺ็-๎]/);
  });
});
