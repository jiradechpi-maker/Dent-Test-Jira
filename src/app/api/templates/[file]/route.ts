import { NextResponse } from "next/server";
import { DOCUMENT_TEMPLATES } from "@/config/templates";
import { loadTemplate } from "@/server/render-docx";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // Only whitelisted template files can be downloaded — never an arbitrary path.
  const template = DOCUMENT_TEMPLATES.find((t) => t.file === file);
  if (!template) return NextResponse.json({ error: "ไม่พบแม่แบบ" }, { status: 404 });
  const buffer = await loadTemplate(template.file);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${template.file}"`,
      "Cache-Control": "no-store",
    },
  });
}
