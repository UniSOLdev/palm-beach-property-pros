import { authorizeCron } from "@/lib/autopilot/auth/cron-auth";
import { runDailyOps } from "@/lib/autopilot/engines/task-engine";
import { dailyRunKey } from "@/lib/autopilot/run-log";
import { runEngine } from "@/lib/autopilot/runner";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const result = await runEngine("ops-daily", dailyRunKey(), () => runDailyOps());
  return Response.json(result);
}
