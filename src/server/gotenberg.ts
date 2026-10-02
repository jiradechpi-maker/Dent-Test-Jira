/**
 * Minimal Gotenberg client: .docx → .pdf through LibreOffice headless.
 * https://gotenberg.dev/docs/routes#convert-with-libreoffice
 */

export class PdfConversionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
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
    throw new PdfConversionError("ยังไม่ได้ตั้งค่า GOTENBERG_URL — ดาวน์โหลดเป็น .docx ได้ตามปกติ", 503);
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
    const reason = error instanceof Error && error.name === "TimeoutError" ? "หมดเวลาเชื่อมต่อ" : "เชื่อมต่อไม่ได้";
    throw new PdfConversionError(`บริการแปลง PDF (Gotenberg) ${reason}`, 502);
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new PdfConversionError(`Gotenberg ตอบกลับ ${response.status}${detail ? `: ${detail}` : ""}`, 502);
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
