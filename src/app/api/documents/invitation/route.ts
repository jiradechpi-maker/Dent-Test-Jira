import { NextResponse } from "next/server";
import { getT } from "@/lib/i18n/server";
import { buildInvitationTemplateData, invitationFileName, invitationProtectedWords } from "@/lib/invitation/template-data";
import { makeInvitationRequestSchema } from "@/lib/invitation/schema";
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
  // Error messages follow the viewer's language (locale cookie); the document itself is always Thai.
  const t = await getT();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, t("รูปแบบข้อมูลไม่ถูกต้อง", "Invalid request format"));
  }

  const parsed = makeInvitationRequestSchema(t).safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      422,
      t("ข้อมูลไม่ครบถ้วน", "Some required information is missing"),
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    );
  }

  const { format, data } = parsed.data;

  try {
    const template = await loadTemplate(TEMPLATE_FILE);
    const docx = renderDocx(template, buildInvitationTemplateData(data));
    const fileName = invitationFileName(data, format);
    const payload =
      format === "pdf"
        ? await convertDocxToPdf(prepareDocxForLibreOffice(docx, invitationProtectedWords(data)), invitationFileName(data, "docx"))
        : docx;

    return new NextResponse(new Uint8Array(payload), {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[format],
        "Content-Disposition": `attachment; filename="invitation.${format}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof PdfConversionError) return errorResponse(error.status, t(error.text));
    if (error instanceof TemplateRenderError) return errorResponse(500, t(error.text), error.details);
    console.error("[invitation] unexpected error", error);
    return errorResponse(500, t("เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่", "An unexpected error occurred. Please try again."));
  }
}
