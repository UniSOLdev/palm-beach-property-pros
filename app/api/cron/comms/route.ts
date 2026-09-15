import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/autopilot/auth/cron-auth";
import { runCommsEngine } from "@/lib/autopilot/engines/comms-engine";
import { commsRunKey } from "@/lib/autopilot/run-log";
import { runEngine } from "@/lib/autopilot/runner";

export async function GET(request: Request) {
  const authError = authorizeCron(request);
  if (authError) return authError;

  const result = await runEngine("comms", commsRunKey(), runCommsEngine);
  return NextResponse.json(result);
}
