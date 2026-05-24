import { DashboardAnalytics } from "@/components/admin/dashboard-analytics";
import { DashboardTasks } from "@/components/admin/dashboard-tasks";
import { getDashboardStats } from "@/lib/admin/queries";
import { listCrewOptions, listTasks, spawnRecurringTasks } from "@/lib/admin/actions/tasks";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  try {
    await spawnRecurringTasks();
  } catch {
    /* non-blocking */
  }
  const [stats, tasks, crew] = await Promise.all([
    getDashboardStats(),
    listTasks(),
    listCrewOptions(),
  ]);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ocean">PBPP Ops</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">Operations</h1>
        <p className="text-sm text-charcoal/70">Field command center · Palm Beach Property Pros</p>
      </div>

      <DashboardTasks tasks={tasks} crew={crew} />
      <DashboardAnalytics stats={stats} />
    </div>
  );
}
