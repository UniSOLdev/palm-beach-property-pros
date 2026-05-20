"use client";

import { useSearchParams } from "next/navigation";
import { TasksBoard } from "@/components/admin/tasks-board";
import type { CrewOption, TaskRow } from "@/lib/admin/types";

export function TasksBoardClient({ initialTasks, crew }: { initialTasks: TaskRow[]; crew: CrewOption[] }) {
  const searchParams = useSearchParams();
  const openNewOnMount = searchParams.get("new") === "1";
  return <TasksBoard initialTasks={initialTasks} crew={crew} openNewOnMount={openNewOnMount} />;
}
