"use client";

import Link from "next/link";
import type { ModularSectionType } from "@/lib/site-builder/section-registry";
import { parseModularSectionContent } from "@/lib/site-builder/schemas";

export function ModularSectionEditor({
  type,
  content,
  onChange,
}: {
  type: ModularSectionType;
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}) {
  const data = parseModularSectionContent(type, content);

  function patch(partial: Record<string, unknown>) {
    onChange({ ...content, ...partial });
  }

  const record = data as Record<string, unknown>;

  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-sky/20 px-3 py-2 text-xs text-navy">
        Premium modular section — structured content aligned to the live marketing site.
      </p>

      {typeof record.eyebrow === "string" ? (
        <TextField label="Eyebrow" value={record.eyebrow} onChange={(v) => patch({ eyebrow: v })} />
      ) : null}
      {typeof record.headline === "string" ? (
        <TextField label="Headline" value={record.headline} onChange={(v) => patch({ headline: v })} />
      ) : null}
      {typeof record.lead === "string" ? (
        <TextArea label="Lead" value={record.lead} onChange={(v) => patch({ lead: v })} />
      ) : null}
      {typeof record.subheadline === "string" ? (
        <TextArea label="Subheadline" value={record.subheadline} onChange={(v) => patch({ subheadline: v })} />
      ) : null}
      {typeof record.body === "string" ? (
        <TextArea label="Body" value={record.body} onChange={(v) => patch({ body: v })} />
      ) : null}

      {typeof record.source === "string" ? (
        <label className="block text-sm font-medium text-navy">
          Content source
          <select
            className="admin-input"
            value={record.source}
            onChange={(e) => patch({ source: e.target.value })}
          >
            <option value="database">Database collections</option>
            <option value="manual">Manual content</option>
          </select>
        </label>
      ) : null}

      {(type === "transformation_proof" || type === "additional_proof") && record.source === "database" ? (
        <div className="rounded-xl border border-ocean/20 bg-cream/40 p-3 text-sm">
          <p className="font-semibold text-navy">Transformation pairs</p>
          <p className="mt-1 text-xs text-charcoal/70">
            Assign pairs in the Transformations admin — never auto-paired.
          </p>
          <Link href="/admin/website/transformations" className="mt-2 inline-flex text-xs font-semibold text-ocean no-underline hover:underline">
            Open pair editor →
          </Link>
        </div>
      ) : null}

      {type === "project_recap" ? (
        <Link href="/admin/website/projects" className="inline-flex text-xs font-semibold text-ocean no-underline hover:underline">
          Manage projects →
        </Link>
      ) : null}

      {typeof record.showPhone === "boolean" ? (
        <label className="flex items-center gap-2 text-sm text-navy">
          <input
            type="checkbox"
            checked={record.showPhone}
            onChange={(e) => patch({ showPhone: e.target.checked })}
          />
          Show phone CTA
        </label>
      ) : null}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-navy">
      {label}
      <input className="admin-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-navy">
      {label}
      <textarea className="admin-input min-h-[96px]" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
