import { TasksBoard } from "@/components/admin/tasks-board";
import { listCrewOptions, listTasks, spawnRecurringTasks } from "@/lib/admin/actions/tasks";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tasks" };

export default async function AdminTasksPage() {
  await spawnRecurringTasks();
  const [tasks, crew] = await Promise.all([listTasks(), listCrewOptions()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-navy">Tasks</h1>
        <p className="text-sm text-charcoal/70">
          Daily command center — jobs, invoices, clients, and field follow-ups.
        </p>
      </div>
      <TasksBoard initialTasks={tasks} crew={crew} />
    </div>
  );
}
