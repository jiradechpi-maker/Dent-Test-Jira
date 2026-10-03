import "server-only";
import type { Bi } from "@/lib/i18n/locale";
import { SourceError } from "@/lib/schedule/bundle";
import { accessToken, type ServiceAccount } from "./service-account";

const API = "https://www.googleapis.com/drive/v3/files";
const SHEET_MIME = "application/vnd.google-apps.spreadsheet";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export interface DriveFileMeta {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  modifiedBy: string | null;
  webViewLink: string;
}

/** A Drive failure the user can act on; `text` is shown on screen in both languages. */
export class DriveError extends SourceError {
  constructor(
    text: Bi,
    readonly status: number,
  ) {
    super(text);
    this.name = "DriveError";
  }
}

async function driveFetch(url: string, account: ServiceAccount): Promise<Response> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${await accessToken(account)}` }, cache: "no-store" });
  if (response.ok) return response;
  const status = response.status;
  if (status === 404 || status === 403) {
    throw new DriveError(
      {
        th: `service account (${account.clientEmail}) ยังไม่มีสิทธิ์เปิดไฟล์นี้ — กด Share ในไฟล์แล้วเพิ่มอีเมลนี้เป็น Viewer`,
        en: `The service account (${account.clientEmail}) cannot open this file yet — click Share in the file and add this email as a Viewer`,
      },
      status,
    );
  }
  const body = (await response.text()).slice(0, 300);
  throw new DriveError({ th: `Google Drive ตอบกลับ HTTP ${status}: ${body}`, en: `Google Drive responded with HTTP ${status}: ${body}` }, status);
}

export async function getFileMeta(fileId: string, account: ServiceAccount): Promise<DriveFileMeta> {
  const fields = "id,name,mimeType,modifiedTime,webViewLink,lastModifyingUser(displayName)";
  const response = await driveFetch(`${API}/${encodeURIComponent(fileId)}?fields=${fields}&supportsAllDrives=true`, account);
  const body = (await response.json()) as {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime?: string;
    webViewLink?: string;
    lastModifyingUser?: { displayName?: string };
  };
  return {
    id: body.id,
    name: body.name,
    mimeType: body.mimeType,
    modifiedTime: body.modifiedTime ?? null,
    modifiedBy: body.lastModifyingUser?.displayName ?? null,
    webViewLink: body.webViewLink ?? viewUrl(fileId, body.mimeType),
  };
}

/** Native Google Sheets are exported to .xlsx; uploaded .xlsx files are downloaded as-is. */
export async function downloadSpreadsheet(meta: DriveFileMeta, account: ServiceAccount): Promise<Uint8Array> {
  const url =
    meta.mimeType === SHEET_MIME
      ? `${API}/${encodeURIComponent(meta.id)}/export?mimeType=${encodeURIComponent(XLSX_MIME)}`
      : `${API}/${encodeURIComponent(meta.id)}?alt=media&supportsAllDrives=true`;
  const response = await driveFetch(url, account);
  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Without a service account, fetch through the public "anyone with the link" endpoints. Works only when
 * the file's General access is "Anyone with the link".
 */
export async function downloadPublicSpreadsheet(fileId: string): Promise<Uint8Array> {
  const id = encodeURIComponent(fileId);
  const candidates = [
    `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`,
    `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
  ];
  let reachable = false;
  for (const url of candidates) {
    let response: Response;
    try {
      response = await fetch(url, { cache: "no-store", redirect: "follow" });
    } catch {
      continue;
    }
    reachable = true;
    if (!response.ok) continue;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes[0] === 0x50 && bytes[1] === 0x4b) return bytes; // "PK" — a zip, i.e. an .xlsx
  }
  if (!reachable) {
    throw new DriveError(
      {
        th: "เซิร์ฟเวอร์ติดต่อ Google ไม่ได้ (เครือข่าย) — ลองใหม่ภายหลัง หรืออัปโหลดไฟล์ .xlsx เองระหว่างนี้",
        en: "The server cannot reach Google (network) — try again later, or upload the .xlsx file yourself in the meantime",
      },
      503,
    );
  }
  throw new DriveError(
    {
      th: "เปิดไฟล์แบบสาธารณะไม่ได้ — ไฟล์ไม่ได้เปิดสิทธิ์ \"ทุกคนที่มีลิงก์\" (ตั้งค่า service account แทนได้)",
      en: "Cannot open the file through its public link — General access is not set to \"Anyone with the link\" (or set up a service account instead)",
    },
    403,
  );
}

export function viewUrl(fileId: string, mimeType?: string): string {
  return mimeType === SHEET_MIME
    ? `https://docs.google.com/spreadsheets/d/${fileId}/edit`
    : `https://drive.google.com/file/d/${fileId}/view`;
}
