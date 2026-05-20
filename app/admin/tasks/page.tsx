import { TasksBoard } from "@/components/admin/tasks-board";
import { listTasks, spawnRecurringTasks } from "@/lib/admin/actions/tasks";

export const metadata = { title: "Tasks" };

export default async function AdminTasksPage() {
  await spawnRecurringTasks();
  const tasks = await listTasks();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-navy">Tasks</h1>
        <p className="text-sm text-charcoal/70">Field ops checklist — persistent, prioritized, recurring.</p>
      </div>
      <TasksBoard initialTasks={tasks} />
    </div>
  );
}
