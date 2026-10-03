import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { joinProtected } from "@/lib/thai-wrap";

export class TemplateRenderError extends Error {
  constructor(
    message: string,
    readonly details: string[] = [],
  ) {
    super(message);
    this.name = "TemplateRenderError";
  }
}

const templateCache = new Map<string, Buffer>();

/** Loads a .docx template from /templates (cached in memory for the life of the server instance). */
export async function loadTemplate(fileName: string): Promise<Buffer> {
  const cached = templateCache.get(fileName);
  if (cached) return cached;
  const buffer = await readFile(join(process.cwd(), "templates", fileName));
  templateCache.set(fileName, buffer);
  return buffer;
}

interface DocxtemplaterErrorShape {
  properties?: { errors?: { properties?: { explanation?: string } }[]; explanation?: string };
}

function explain(error: unknown): string[] {
  const shape = error as DocxtemplaterErrorShape;
  const nested = shape.properties?.errors?.map((e) => e.properties?.explanation).filter((e): e is string => Boolean(e));
  if (nested && nested.length > 0) return nested;
  if (shape.properties?.explanation) return [shape.properties.explanation];
  return [error instanceof Error ? error.message : String(error)];
}

/**
 * Renders a docxtemplater template with `{tag}` delimiters.
 * Missing values render as empty strings (never "undefined").
 */
export function renderDocx(template: Buffer, data: object): Buffer {
  try {
    const zip = new PizZip(template);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    });
    doc.render(data);
    return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
  } catch (error) {
    throw new TemplateRenderError("ไม่สามารถสร้างเอกสารจากแม่แบบได้", explain(error));
  }
}

/**
 * Adjusts the rendered .docx for LibreOffice (used by Gotenberg) before PDF conversion:
 *  • LibreOffice does not implement Word's "Thai distributed" alignment and falls back to ragged-right.
 *    Map it to regular justification, which LibreOffice applies at Thai word boundaries.
 *  • LibreOffice breaks Thai with the ICU dictionary, which splits compound words and names
 *    ("ทันตแพทย|ศาสตรบัณฑิต"). Word joiners inside protected words forbid those breaks.
 * The .docx handed to users is untouched — it keeps "thaiDistribute", exactly like the faculty's original.
 */
export function prepareDocxForLibreOffice(docx: Buffer, protectedWords: readonly string[] = []): Buffer {
  const zip = new PizZip(docx);
  for (const name of Object.keys(zip.files)) {
    if (!/^word\/(document|header\d*|footer\d*)\.xml$/.test(name)) continue;
    const file = zip.file(name);
    if (!file) continue;
    const xml = file
      .asText()
      .replace(/w:val="thaiDistribute"/g, 'w:val="both"')
      .replace(/(<w:t(?:\s[^>]*)?>)([^<]*)(<\/w:t>)/g, (_, open: string, text: string, close: string) => open + joinProtected(text, protectedWords) + close);
    zip.file(name, xml);
  }
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
