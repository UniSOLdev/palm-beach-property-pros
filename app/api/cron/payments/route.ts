import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/autopilot/auth/cron-auth";
import { runPaymentsEngine } from "@/lib/autopilot/engines/payments-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = authorizeCron(request);
  if (authError) return authError;

  try {
    const result = await runPaymentsEngine();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error) {
    console.error("[PBPP Payments Cron]", error);
    const message = error instanceof Error ? error.message : "Payments cron failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
