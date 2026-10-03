import { NextResponse } from "next/server";
import { DOCUMENT_TEMPLATES } from "@/config/templates";
import { getT } from "@/lib/i18n/server";
import { loadTemplate } from "@/server/render-docx";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // Only whitelisted template files can be downloaded — never an arbitrary path.
  const template = DOCUMENT_TEMPLATES.find((candidate) => candidate.file === file);
  if (!template) {
    const t = await getT();
    return NextResponse.json({ error: t("ไม่พบแม่แบบ", "Template not found") }, { status: 404 });
  }
  const buffer = await loadTemplate(template.file);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${template.file}"`,
      "Cache-Control": "no-store",
    },
  });
}
