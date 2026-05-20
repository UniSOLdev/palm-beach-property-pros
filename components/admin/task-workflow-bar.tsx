"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { WORKFLOW_SHORTCUTS } from "@/lib/admin/task-constants";
import { createTasksBulk } from "@/lib/admin/actions/tasks";
import type { TaskBulkDefaults } from "@/lib/admin/types";

type WorkflowKey = keyof typeof WORKFLOW_SHORTCUTS;

export function TaskWorkflowBar({
  context,
  defaults,
  label = "Quick shortcuts",
}: {
  context: WorkflowKey;
  defaults: TaskBulkDefaults;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const items = WORKFLOW_SHORTCUTS[context];

  if (!items.length) return null;

  return (
    <details className="rounded-xl border border-navy/10 bg-cream/40 px-3 py-2">
      <summary className="min-h-[44px] cursor-pointer text-sm font-semibold text-navy">{label}</summary>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.title}>
            <button
              type="button"
              disabled={pending}
              className="w-full rounded-lg bg-white px-3 py-2 text-left text-xs font-medium text-navy ring-1 ring-navy/10 disabled:opacity-60"
              onClick={() =>
                startTransition(async () => {
                  await createTasksBulk([item], {
                    ...defaults,
                    category: item.category,
                  });
                  router.refresh();
                })
              }
            >
              + {item.title}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
