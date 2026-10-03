import { describe, expect, it } from "vitest";
import { FIVE_MINUTE_TEXT, announcementText, captionFor, speakableThai, thaiPhrases } from "./announcements";
import { splitForSpeech, thaiVoices, voiceLabel } from "./speech";

describe("5-minute announcement", () => {
  it("uses the faculty's wording by default", () => {
    expect(FIVE_MINUTE_TEXT).toBe("เหลือเวลาสอบอีก 5 นาที กรุณาตรวจสอบความถูกต้อง และอย่าลืมเขียนชื่อและเลขที่ ID");
    expect(announcementText("   ")).toBe(FIVE_MINUTE_TEXT);
    expect(announcementText(" เหลือ 5 นาที ")).toBe("เหลือ 5 นาที");
  });

  it("shows English on screen only while the standard wording is used", () => {
    expect(captionFor(FIVE_MINUTE_TEXT).en).toContain("5 minutes remaining");
    expect(captionFor("เหลือ 5 นาที")).toEqual({ th: "เหลือ 5 นาที", en: "" });
  });

  it("makes the wording easy for a Thai voice to read without changing what is shown", () => {
    expect(speakableThai(FIVE_MINUTE_TEXT)).toBe("เหลือเวลาสอบอีก 5 นาที กรุณาตรวจสอบความถูกต้อง และอย่าลืมเขียนชื่อและเลขที่ ไอดี");
    expect(speakableThai("หมดเวลา 12:30 น.")).toBe("หมดเวลา 12 นาฬิกา 30 นาที");
    expect(speakableThai("เลิก 15.00 น. / ห้อง DT01")).toBe("เลิก 15 นาฬิกาตรง ห้อง DT01");
  });
});

describe("speaking in phrases", () => {
  it("breaks where a person would breathe, keeping numbers with their units", () => {
    expect(thaiPhrases(speakableThai(FIVE_MINUTE_TEXT))).toEqual([
      "เหลือเวลาสอบอีก 5 นาที",
      "กรุณาตรวจสอบความถูกต้อง",
      "และอย่าลืมเขียนชื่อและเลขที่ ไอดี",
    ]);
    expect(thaiPhrases("การสอบจะสิ้นสุดเวลา 12 นาฬิกา 30 นาที กรุณาวางปากกา")).toEqual(["การสอบจะสิ้นสุดเวลา 12 นาฬิกา 30 นาที", "กรุณาวางปากกา"]);
  });

  it("always breaks at commas, full stops and new lines", () => {
    expect(thaiPhrases("เหลือ 5 นาที, ตรวจคำตอบ\nเขียนชื่อ")).toEqual(["เหลือ 5 นาที", "ตรวจคำตอบ", "เขียนชื่อ"]);
    expect(thaiPhrases("")).toEqual([]);
  });
});

describe("voices", () => {
  const voice = (name: string, lang: string, localService: boolean) => ({ name, lang, localService, voiceURI: name, default: false }) as SpeechSynthesisVoice;

  it("lists only usable Thai voices, natural ones first", () => {
    const list = thaiVoices([
      voice("Microsoft Pattara - Thai (Thailand)", "th-TH", true),
      voice("Microsoft Ryan Online (Natural) - English (United Kingdom)", "en-GB", false),
      voice("Microsoft Premwadee Online (Natural) - Thai (Thailand)", "th-TH", false),
      voice("Microsoft Niwat Online (Natural) - Thai (Thailand)", "th-TH", false),
      voice("Microsoft undefined Online (Natural) - undefined", "th-TH", false),
      voice("Kanya", "th_TH", true),
    ]);
    expect(list.map((v) => v.name)).toEqual([
      "Microsoft Premwadee Online (Natural) - Thai (Thailand)",
      "Microsoft Niwat Online (Natural) - Thai (Thailand)",
      "Microsoft Pattara - Thai (Thailand)",
      "Kanya",
    ]);
  });

  it("describes a voice in plain words", () => {
    expect(voiceLabel(voice("Microsoft Premwadee Online (Natural) - Thai (Thailand)", "th-TH", false), "th")).toBe(
      "Premwadee · หญิง · เสียงธรรมชาติ ชัดที่สุด (ใช้อินเทอร์เน็ต)",
    );
    expect(voiceLabel(voice("Microsoft Pattara - Thai (Thailand)", "th-TH", true), "en")).toBe("Pattara · male · on this computer");
  });

  it("splits long Thai text at spaces", () => {
    const chunks = splitForSpeech(FIVE_MINUTE_TEXT, 40);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join(" ")).toBe(FIVE_MINUTE_TEXT);
  });
});
