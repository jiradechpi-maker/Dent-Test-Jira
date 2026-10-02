import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Server clock (NTP-synced) — lets exam timers correct a wrong classroom PC clock. */
export function GET() {
  return NextResponse.json({ now: Date.now() }, { headers: { "Cache-Control": "no-store" } });
}
