import { authorizeCron } from "@/lib/autopilot/auth/cron-auth";
import { runTaskEngine } from "@/lib/autopilot/engines/task-engine";
import { hourlyRunKey } from "@/lib/autopilot/run-log";
import { runEngine } from "@/lib/autopilot/runner";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const result = await runEngine("ops-hourly", hourlyRunKey(), () =>
    runTaskEngine({ rules: ["lead_sla_breach"] }),
  );
  return Response.json(result);
}
