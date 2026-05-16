export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { TaskForm } from "@/components/admin/task-form";
import { getTaskById } from "@/lib/tasks/queries";
import type { AdminTaskRow } from "@/lib/tasks/types";

export const metadata = { title: "Task" };

export default async function AdminTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { task } = await getTaskById(id);
  if (!task) notFound();
  return <TaskForm mode="edit" initial={task as AdminTaskRow} />;
}
