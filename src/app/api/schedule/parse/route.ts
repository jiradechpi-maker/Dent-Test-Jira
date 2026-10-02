import { NextResponse, type NextRequest } from "next/server";
import type { SourceKey } from "@/config/data-sources";
import { parseSource } from "@/server/schedule/sync";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

/** Parse an .xlsx the user downloaded from Drive themselves — a fallback while Drive access is not set up. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const kind = form.get("kind");
  const file = form.get("file");
  if ((kind !== "teaching" && kind !== "invigilation") || !(file instanceof File)) {
    return NextResponse.json({ error: "ต้องส่ง kind (teaching | invigilation) และไฟล์ .xlsx" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 10 MB" }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    return NextResponse.json({ error: "ไม่ใช่ไฟล์ .xlsx — ใน Google Sheets เลือก ไฟล์ → ดาวน์โหลด → Microsoft Excel (.xlsx)" }, { status: 415 });
  }
  try {
    const data = await parseSource(kind as SourceKey, bytes);
    return NextResponse.json({ kind, fileName: file.name, data });
  } catch (error) {
    return NextResponse.json({ error: `อ่านไฟล์ไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}` }, { status: 422 });
  }
}
