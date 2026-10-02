import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

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
