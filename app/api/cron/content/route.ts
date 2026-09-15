import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/autopilot/auth/cron-auth";
import { runContentEngine } from "@/lib/autopilot/engines/content-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Weekly content autopilot — Monday 8am ET (see vercel.json). */
export async function GET(request: Request) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const result = await runContentEngine();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function POST(request: Request) {
  return GET(request);
}
