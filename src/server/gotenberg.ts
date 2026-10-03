/**
 * Minimal Gotenberg client: .docx → .pdf through LibreOffice headless.
 * https://gotenberg.dev/docs/routes#convert-with-libreoffice
 */
import { bi, type Bi } from "@/lib/i18n/locale";

/** `text` is the user-facing message (render with t()); `status` is the HTTP status to answer with. */
export class PdfConversionError extends Error {
  constructor(
    readonly text: Bi,
    readonly status: number,
  ) {
    super(text.th);
    this.name = "PdfConversionError";
  }
}

export function gotenbergUrl(): string | null {
  const url = process.env.GOTENBERG_URL?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}

function authHeader(): Record<string, string> {
  const user = process.env.GOTENBERG_USERNAME?.trim();
  const pass = process.env.GOTENBERG_PASSWORD ?? "";
  if (!user) return {};
  return { Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}` };
}

const CONVERT_TIMEOUT_MS = 30_000;

export async function convertDocxToPdf(docx: Buffer, fileName = "document.docx"): Promise<Buffer> {
  const base = gotenbergUrl();
  if (!base) {
    throw new PdfConversionError(
      bi("ยังไม่ได้ตั้งค่า GOTENBERG_URL — ดาวน์โหลดเป็น .docx ได้ตามปกติ", "GOTENBERG_URL is not configured — you can still download the .docx"),
      503,
    );
  }

  const form = new FormData();
  form.append(
    "files",
    new Blob([new Uint8Array(docx)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    fileName,
  );
  // Keep the exact page geometry defined in the .docx (A4, KMITL margins).
  form.append("exportFormFields", "false");

  let response: Response;
  try {
    response = await fetch(`${base}/forms/libreoffice/convert`, {
      method: "POST",
      body: form,
      headers: authHeader(),
      signal: AbortSignal.timeout(CONVERT_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new PdfConversionError(
      timedOut
        ? bi("บริการแปลง PDF (Gotenberg) หมดเวลาเชื่อมต่อ", "The PDF conversion service (Gotenberg) timed out")
        : bi("บริการแปลง PDF (Gotenberg) เชื่อมต่อไม่ได้", "Couldn't reach the PDF conversion service (Gotenberg)"),
      502,
    );
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    const suffix = `${response.status}${detail ? `: ${detail}` : ""}`;
    throw new PdfConversionError(bi(`Gotenberg ตอบกลับ ${suffix}`, `Gotenberg responded ${suffix}`), 502);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function isGotenbergHealthy(): Promise<boolean> {
  const base = gotenbergUrl();
  if (!base) return false;
  try {
    const response = await fetch(`${base}/health`, {
      headers: authHeader(),
      signal: AbortSignal.timeout(3_000),
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
