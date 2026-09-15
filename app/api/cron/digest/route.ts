import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/autopilot/auth/cron-auth";
import { runWeeklyOpsDigest } from "@/lib/autopilot/engines/digest-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  try {
    const result = await runWeeklyOpsDigest();
    return NextResponse.json({ ok: result.ok, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
