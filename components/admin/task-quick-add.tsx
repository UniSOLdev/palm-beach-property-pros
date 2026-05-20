"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TaskFormModal, type TaskFormDefaults } from "@/components/admin/task-form-modal";
import type { CrewOption } from "@/lib/admin/types";

type TaskQuickAddProps = {
  label?: string;
  defaults?: TaskFormDefaults;
  crew: CrewOption[];
  variant?: "primary" | "secondary" | "compact";
  className?: string;
};

export function TaskQuickAdd({
  label = "Add task",
  defaults = {},
  crew,
  variant = "secondary",
  className = "",
}: TaskQuickAddProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const btnClass =
    variant === "primary"
      ? "admin-btn"
      : variant === "compact"
        ? "text-xs font-semibold text-ocean no-underline min-h-[44px] inline-flex items-center"
        : "admin-btn-secondary";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${btnClass} ${className}`.trim()}>
        {label}
      </button>
      <TaskFormModal
        open={open}
        onClose={() => setOpen(false)}
        defaults={defaults}
        crew={crew}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
