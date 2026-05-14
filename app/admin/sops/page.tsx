import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/ui";
import { listSopTemplates } from "@/lib/admin/queries";

export default async function SopsPage() {
  const templates = await listSopTemplates();

  return (
    <div>
      <AdminPageHeader
        title="SOPs"
        subtitle="Notion-like clarity with field-ready checklists for every core service."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((s) => (
          <Link
            key={s.id}
            href={`/admin/sops/${s.slug}`}
            className="group rounded-2xl border border-navy/10 bg-white p-5 shadow-card no-underline transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-ocean/80">Playbook</div>
            <div className="mt-2 text-lg font-bold text-navy group-hover:text-ocean">{s.title}</div>
            <div className="mt-2 text-sm text-charcoal/65">
              {s.estimatedMinutes} min · {s.steps.length} steps · QC + photos included
            </div>
            <div className="mt-4 text-sm font-semibold text-ocean">Open checklist →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
