import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { listWebsiteProjectsAdmin } from "@/lib/admin/website-queries";

export default async function WebsiteProjectsPage() {
  const rows = await listWebsiteProjectsAdmin();
  return (
    <div>
      <AdminPageHeader title="Featured projects" subtitle="Before/after project stories (add via Supabase or a future form)." />
      <Card>
        {rows.length === 0 ? (
          <p className="text-sm text-charcoal/70">
            No projects yet. After migration <code className="rounded bg-ice px-1">006_website_content.sql</code>, insert rows in{" "}
            <code className="rounded bg-ice px-1">website_projects</code> or extend this screen with a create form.
          </p>
        ) : (
          <ul className="divide-y divide-navy/10">
            {rows.map((p) => (
              <li key={p.id} className="py-3">
                <div className="font-semibold text-navy">{p.title}</div>
                <div className="text-xs text-charcoal/60">{[p.serviceType, p.city].filter(Boolean).join(" · ")}</div>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/website/gallery" className="mt-4 inline-block text-sm font-semibold text-ocean no-underline">
          Manage gallery photos →
        </Link>
      </Card>
    </div>
  );
}
