import type { DocumentFormat, InvitationInput } from "./schema";

export class DocumentApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = [],
  ) {
    super(message);
    this.name = "DocumentApiError";
  }
}

function fileNameFrom(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      return fallback;
    }
  }
  const plain = /filename="([^"]+)"/i.exec(disposition);
  return plain?.[1] ?? fallback;
}

export async function requestInvitation(
  data: InvitationInput,
  format: DocumentFormat,
  signal?: AbortSignal,
): Promise<{ blob: Blob; fileName: string }> {
  let response: Response;
  try {
    response = await fetch("/api/documents/invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, data }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new DocumentApiError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต", 0);
  }

  if (!response.ok) {
    let message = `เกิดข้อผิดพลาด (${response.status})`;
    let details: string[] = [];
    try {
      const body = (await response.json()) as { error?: unknown; details?: unknown };
      if (typeof body.error === "string") message = body.error;
      if (Array.isArray(body.details)) details = body.details.filter((d): d is string => typeof d === "string");
    } catch {
      // non-JSON error body
    }
    throw new DocumentApiError(message, response.status, details);
  }

  const blob = await response.blob();
  return { blob, fileName: fileNameFrom(response.headers.get("Content-Disposition"), `invitation.${format}`) };
}

export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
