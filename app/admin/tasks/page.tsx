export const dynamic = "force-dynamic";

import { TasksBoard } from "@/components/admin/tasks-board";
import { listTasks } from "@/lib/tasks/queries";

export const metadata = { title: "Tasks" };

export default async function AdminTasksPage() {
  const { tasks, using_fallback } = await listTasks({ due: "all" });
  return <TasksBoard initialTasks={tasks} usingFallback={using_fallback} />;
}
