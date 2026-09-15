"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/admin/format";
import { listEntityActivityAction } from "@/lib/admin/actions/entity-lifecycle";
import type { AdminEntityType } from "@/lib/admin/lifecycle/types";

const ACTION_LABEL: Record<string, string> = {
  archived: "Archived",
  unarchived: "Restored from archive",
  deleted: "Moved to trash",
  restored: "Restored from trash",
  duplicated: "Duplicated",
  created: "Created",
  updated: "Updated",
  status_changed: "Status changed",
};

export function EntityActivityTimeline({
  entityType,
  entityId,
}: {
  entityType: AdminEntityType;
  entityId: string;
}) {
  const [rows, setRows] = useState<
    Array<{ id: string; action: string; summary: string | null; created_at: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listEntityActivityAction(entityType, entityId)
      .then((data) => {
        if (!cancelled) setRows(data as typeof rows);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load activity");
      });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  if (error) {
    return <p className="text-sm text-charcoal/50">{error}</p>;
  }

  if (!rows.length) {
    return <p className="text-sm text-charcoal/50">No lifecycle activity logged yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {rows.map((row) => (
        <li key={row.id} className="flex gap-3 rounded-xl border border-navy/[0.06] bg-white/70 px-4 py-3">
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-aqua" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-navy">
              {row.summary ?? ACTION_LABEL[row.action] ?? row.action}
            </p>
            <p className="text-xs text-charcoal/50">{formatDate(row.created_at)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
