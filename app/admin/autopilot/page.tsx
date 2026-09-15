import { AutopilotDashboard } from "@/components/admin/autopilot-dashboard";
import { getAutopilotDashboard } from "@/lib/autopilot/actions/dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Autopilot" };

export default async function AutopilotAdminPage() {
  let initial: Awaited<ReturnType<typeof getAutopilotDashboard>> | null = null;
  let loadError = "";

  try {
    initial = await getAutopilotDashboard();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load autopilot dashboard";
  }

  return (
    <div className="space-y-4">
      {loadError ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          {" — "}
          Unpause the Supabase project and run migration{" "}
          <code className="text-xs">20260615140000_autopilot_foundation.sql</code> if tables are
          missing.
        </p>
      ) : null}
      {initial ? <AutopilotDashboard initial={initial} /> : null}
    </div>
  );
}
