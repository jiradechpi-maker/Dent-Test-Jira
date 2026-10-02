import { NextResponse } from "next/server";
import { gotenbergUrl, isGotenbergHealthy } from "@/server/gotenberg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configured = gotenbergUrl() !== null;
  const pdf = configured ? await isGotenbergHealthy() : false;
  return NextResponse.json({ ok: true, services: { pdf: { configured, healthy: pdf } } });
}
