import { bi, type Bi } from "@/lib/i18n/locale";
import type { DocumentFormat, InvitationInput } from "./schema";

/**
 * A failed document request. `text` is what to show (render with t()); messages from the server are
 * already in the viewer's language (the route reads the locale cookie), so both sides carry the same string.
 */
export class DocumentApiError extends Error {
  constructor(
    readonly text: Bi,
    readonly status: number,
    readonly details: string[] = [],
  ) {
    super(text.th);
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
    throw new DocumentApiError(
      bi("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต", "Couldn't reach the server. Please check your internet connection."),
      0,
    );
  }

  if (!response.ok) {
    let text = bi(`เกิดข้อผิดพลาด (${response.status})`, `Something went wrong (${response.status})`);
    let details: string[] = [];
    try {
      const body = (await response.json()) as { error?: unknown; details?: unknown };
      if (typeof body.error === "string") text = bi(body.error, body.error);
      if (Array.isArray(body.details)) details = body.details.filter((d): d is string => typeof d === "string");
    } catch {
      // non-JSON error body
    }
    throw new DocumentApiError(text, response.status, details);
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
