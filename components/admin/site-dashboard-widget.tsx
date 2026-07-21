import Link from "next/link";
import { getSiteDashboardStats } from "@/lib/admin/actions/site-homepage";

export async function SiteDashboardWidget() {
  let stats: Awaited<ReturnType<typeof getSiteDashboardStats>> | null = null;
  try {
    stats = await getSiteDashboardStats();
  } catch {
    return null;
  }

  if (!stats) return null;

  const cards = [
    { label: "New leads", value: stats.newLeads, href: "/admin/leads?status=new", tone: "bg-sky/50" },
    { label: "Need follow-up", value: stats.followUpLeads, href: "/admin/leads", tone: "bg-sand/60" },
    { label: "Published projects", value: stats.publishedProjects, href: "/admin/site/projects", tone: "bg-leaf/20" },
    { label: "Draft projects", value: stats.draftProjects, href: "/admin/site/projects", tone: "bg-charcoal/10" },
    { label: "Active services", value: stats.activeServices, href: "/admin/site/services", tone: "bg-ocean/10" },
  ];

  return (
    <section className="admin-card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ocean">Website CMS</p>
          <h2 className="text-lg font-bold text-navy">Site management</h2>
        </div>
        <Link href="/admin/site" className="admin-btn-secondary min-h-[44px] px-3 text-xs no-underline">
          Open CMS
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl border border-navy/10 p-3 no-underline ${card.tone}`}
          >
            <p className="text-2xl font-bold text-navy">{card.value}</p>
            <p className="text-xs font-medium text-charcoal/80">{card.label}</p>
          </Link>
        ))}
      </div>

      {stats.recentLeads.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">Recent submissions</p>
          <ul className="mt-2 space-y-2">
            {stats.recentLeads.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="flex items-center justify-between rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm no-underline"
                >
                  <span className="font-medium text-navy">{lead.name}</span>
                  <span className="text-xs text-charcoal/60">{lead.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/site/homepage" className="admin-btn min-h-[44px] px-3 text-xs no-underline">
          Edit homepage
        </Link>
        <Link href="/admin/site/services" className="admin-btn-secondary min-h-[44px] px-3 text-xs no-underline">
          Services
        </Link>
        <Link href="/admin/site/projects" className="admin-btn-secondary min-h-[44px] px-3 text-xs no-underline">
          Projects
        </Link>
        <Link href="/admin/website/media" className="admin-btn-secondary min-h-[44px] px-3 text-xs no-underline">
          Media library
        </Link>
      </div>
    </section>
  );
}
