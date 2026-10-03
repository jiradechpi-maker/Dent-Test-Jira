import { readFileSync } from "node:fs";
import { join } from "node:path";
import PizZip from "pizzip";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SAMPLE_INVITATION } from "@/lib/invitation/sample";
import { invitationSchema } from "@/lib/invitation/schema";
import { buildInvitationTemplateData, invitationProtectedWords } from "@/lib/invitation/template-data";
import { renderDocx } from "@/server/render-docx";
import { LetterPages } from "./letter-pages";

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&apos;/g, "'");
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

function docxParagraphs(docx: Buffer): string[] {
  const parts = ["word/document.xml", "word/footer1.xml", "word/footer2.xml"];
  const zip = new PizZip(docx);
  return parts
    .flatMap((name) => (zip.file(name)?.asText() ?? "").split("</w:p>"))
    .map((p) => p.replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g, ""))
    .map((p) => norm(decode(p.replace(/<w:tab\/>/g, " ").replace(/<[^>]+>/g, ""))))
    .filter(Boolean);
}

function htmlText(html: string): string {
  return norm(decode(html.replace(/<\/(p|div|td|th|section)>/g, " ").replace(/<[^>]+>/g, "")));
}

describe("HTML letter (browser preview / print / PDF)", () => {
  const input = invitationSchema.parse(SAMPLE_INVITATION);
  const data = buildInvitationTemplateData(input);
  const docx = renderDocx(readFileSync(join(process.cwd(), "templates", "invitation-letter.docx")), data);
  const html = renderToStaticMarkup(createElement(LetterPages, { data, protectedWords: invitationProtectedWords(input) }));
  const text = htmlText(html);

  it("contains every paragraph of the Word file, word for word", () => {
    const paragraphs = docxParagraphs(docx);
    expect(paragraphs.length).toBeGreaterThan(20);
    const squeeze = (s: string) => s.replace(/\s+/g, "");
    for (const paragraph of paragraphs) expect(squeeze(text)).toContain(squeeze(paragraph));
  });

  it("keeps compound words and the lecturer's name from breaking across lines", () => {
    expect(html).toMatch(/<span class="[^"]*">ทันตแพทยศาสตรบัณฑิต<\/span>/);
    expect(html).toMatch(/<span class="[^"]*">จันทรมณี<\/span>/);
  });

  it("leaves the day blank for the registry when no day is chosen", () => {
    expect(data.issueDate).toBe("สิงหาคม ๒๕๖๙");
    expect(text).toContain("สิงหาคม ๒๕๖๙ เรื่อง");
  });
});
