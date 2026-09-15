import { Suspense } from "react";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import { TasksBoardClient } from "@/components/admin/tasks-board-client";
import { listCrewOptions, listTasks, spawnRecurringTasks } from "@/lib/admin/actions/tasks";
import { lifecycleOptionsFromSearchParams } from "@/lib/admin/lifecycle/search-params";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tasks" };

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const lifecycle = lifecycleOptionsFromSearchParams({ archived });

  try {
    await spawnRecurringTasks();
  } catch {
    /* non-blocking */
  }
  const [tasks, crew] = await Promise.all([
    listTasks({ showArchived: lifecycle.showArchived }),
    listCrewOptions(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-navy">Tasks</h1>
        <p className="text-sm text-charcoal/70">
          Daily command center — jobs, invoices, clients, and field follow-ups.
        </p>
      </div>
      <AdminListToolbar />
      <Suspense fallback={<p className="text-sm text-charcoal/60">Loading tasks…</p>}>
        <TasksBoardClient initialTasks={tasks} crew={crew} />
      </Suspense>
    </div>
  );
}
