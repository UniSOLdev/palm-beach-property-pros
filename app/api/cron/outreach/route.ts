import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/autopilot/auth/cron-auth";
import { runOutreachEngine } from "@/lib/autopilot/engines/outreach-engine";
import { dailyRunKey } from "@/lib/autopilot/run-log";
import { runEngine } from "@/lib/autopilot/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Weekday 9am — enroll new prospects and generate outreach drafts for review. */
export async function GET(request: Request) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const result = await runEngine("outreach", dailyRunKey(), runOutreachEngine);
  return NextResponse.json(result);
}
