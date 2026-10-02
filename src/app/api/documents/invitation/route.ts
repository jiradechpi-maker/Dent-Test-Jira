import { NextResponse } from "next/server";
import { buildInvitationTemplateData, invitationFileName } from "@/lib/invitation/template-data";
import { invitationRequestSchema } from "@/lib/invitation/schema";
import { convertDocxToPdf, PdfConversionError } from "@/server/gotenberg";
import { loadTemplate, prepareDocxForLibreOffice, renderDocx, TemplateRenderError } from "@/server/render-docx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPLATE_FILE = "invitation-letter.docx";

const CONTENT_TYPES = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
} as const;

function errorResponse(status: number, message: string, details: string[] = []) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "รูปแบบข้อมูลไม่ถูกต้อง");
  }

  const parsed = invitationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      422,
      "ข้อมูลไม่ครบถ้วน",
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    );
  }

  const { format, data } = parsed.data;

  try {
    const template = await loadTemplate(TEMPLATE_FILE);
    const docx = renderDocx(template, buildInvitationTemplateData(data));
    const fileName = invitationFileName(data, format);
    const payload =
      format === "pdf" ? await convertDocxToPdf(prepareDocxForLibreOffice(docx), invitationFileName(data, "docx")) : docx;

    return new NextResponse(new Uint8Array(payload), {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[format],
        "Content-Disposition": `attachment; filename="invitation.${format}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof PdfConversionError) return errorResponse(error.status, error.message);
    if (error instanceof TemplateRenderError) return errorResponse(500, error.message, error.details);
    console.error("[invitation] unexpected error", error);
    return errorResponse(500, "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่");
  }
}
