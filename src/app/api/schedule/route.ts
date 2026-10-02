import { NextResponse, type NextRequest } from "next/server";
import { loadScheduleBundle } from "@/server/schedule/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Read-only view of the Google Drive schedules. `?refresh=1` skips the 30-second change-check cache. */
export async function GET(request: NextRequest) {
  const force = request.nextUrl.searchParams.get("refresh") === "1";
  const bundle = await loadScheduleBundle({ force });
  return NextResponse.json(bundle, { headers: { "Cache-Control": "no-store" } });
}
