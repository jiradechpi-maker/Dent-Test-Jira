import { NextResponse, type NextRequest } from "next/server";
import type { SourceKey } from "@/config/data-sources";
import { errorText } from "@/lib/schedule/bundle";
import type { Bi } from "@/lib/i18n/locale";
import { parseSource } from "@/server/schedule/sync";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

/** Errors go back in both languages; the screen shows the one the user chose. */
const fail = (error: Bi, status: number) => NextResponse.json({ error }, { status });

/** Parse an .xlsx the user downloaded from Drive themselves — a fallback while Drive access is not set up. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const kind = form.get("kind");
  const file = form.get("file");
  if ((kind !== "teaching" && kind !== "invigilation") || !(file instanceof File)) {
    return fail(
      { th: "ต้องส่ง kind (teaching | invigilation) และไฟล์ .xlsx", en: "The request needs kind (teaching | invigilation) and an .xlsx file" },
      400,
    );
  }
  if (file.size > MAX_BYTES) return fail({ th: "ไฟล์ใหญ่เกิน 10 MB", en: "The file is larger than 10 MB" }, 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    return fail(
      {
        th: "ไม่ใช่ไฟล์ .xlsx — ใน Google Sheets เลือก ไฟล์ → ดาวน์โหลด → Microsoft Excel (.xlsx)",
        en: "Not an .xlsx file — in Google Sheets choose File → Download → Microsoft Excel (.xlsx)",
      },
      415,
    );
  }
  try {
    const data = await parseSource(kind as SourceKey, bytes);
    return NextResponse.json({ kind, fileName: file.name, data });
  } catch (error) {
    const reason = errorText(error);
    return fail({ th: `อ่านไฟล์ไม่สำเร็จ: ${reason.th}`, en: `Could not read the file: ${reason.en}` }, 422);
  }
}
