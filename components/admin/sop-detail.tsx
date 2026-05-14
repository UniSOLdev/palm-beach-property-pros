"use client";

import { useMemo, useState } from "react";
import type { SopTemplate } from "@/lib/admin/types";
import { Card } from "@/components/admin/ui";

function Checklist({
  title,
  items,
}: {
  title: string;
  items: { id: string; label: string }[];
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});

  return (
    <Card title={title}>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-navy/25"
              checked={Boolean(done[item.id])}
              onChange={(e) => setDone((d) => ({ ...d, [item.id]: e.target.checked }))}
            />
            <span className={`text-sm leading-relaxed ${done[item.id] ? "text-charcoal/45 line-through" : "text-charcoal"}`}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function SopDetail({ sop }: { sop: SopTemplate }) {
  const minutes = useMemo(() => sop.estimatedMinutes, [sop.estimatedMinutes]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Estimated time">
          <div className="text-3xl font-bold text-navy">{Math.round(minutes / 60)}h</div>
          <div className="text-sm text-charcoal/60">{minutes} minutes total</div>
        </Card>
        <Card title="Crew roles" className="md:col-span-2">
          <ul className="list-disc space-y-1 pl-5 text-sm text-charcoal/80">
            {sop.crewRoles.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Supplies needed">
        <ul className="grid gap-2 sm:grid-cols-2">
          {sop.suppliesNeeded.map((s) => (
            <li key={s} className="rounded-xl border border-navy/10 bg-sky/40 px-3 py-2 text-sm text-navy">
              {s}
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Checklist title="Step-by-step checklist" items={sop.steps} />
        <Checklist title="Quality control" items={sop.qualityControl} />
        <Checklist title="Before / after photos" items={sop.photoChecklist} />
        <Checklist title="Completion checklist" items={sop.completion} />
      </div>
    </div>
  );
}
