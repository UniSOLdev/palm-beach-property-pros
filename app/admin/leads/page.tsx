import Link from "next/link";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import { EntityLifecycleMenu } from "@/components/admin/entity-lifecycle-menu";
import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { listLeads } from "@/lib/admin/actions/leads";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, leadStatusClass, type LeadStatus } from "@/lib/admin/lead-constants";
import { logAdminError } from "@/lib/admin/logger";
import { formatDate } from "@/lib/admin/format";
import { lifecycleOptionsFromSearchParams } from "@/lib/admin/lifecycle/search-params";
import { rowIsArchived, rowIsDeleted } from "@/lib/admin/lifecycle/list-query";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads" };

type Props = {
  searchParams: Promise<{ status?: string; q?: string; archived?: string }>;
};

function phoneTel(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:${digits}` : "#";
}

export default async function AdminLeadsPage({ searchParams }: Props) {
  const { status: statusParam, q, archived } = await searchParams;
  const lifecycle = lifecycleOptionsFromSearchParams({ archived });
  const status =
    statusParam && LEAD_STATUSES.includes(statusParam as LeadStatus)
      ? (statusParam as LeadStatus)
      : "all";
  const search = q?.trim() ?? "";

  let leads: Awaited<ReturnType<typeof listLeads>> = [];
  let allLeads: Awaited<ReturnType<typeof listLeads>> = [];
  let loadError = "";

  try {
    [leads, allLeads] = await Promise.all([
      listLeads({ status, search, showArchived: lifecycle.showArchived }),
      listLeads({ status: "all", showArchived: lifecycle.showArchived }),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load leads";
    logAdminError("leads list failed", e, { route: "/admin/leads" });
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Leads" subtitle="Website quote requests" />
        <LoadError title="Could not load leads" message={loadError} retryHref="/admin/leads" />
      </div>
    );
  }

  const statusCounts = LEAD_STATUSES.reduce(
    (acc, s) => {
      acc[s] = allLeads.filter((l) => l.status === s).length;
      return acc;
    },
    {} as Record<LeadStatus, number>,
  );

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Leads"
        subtitle="Website quote requests — intake pipeline"
        actionHref="/admin/quotes"
        actionLabel="Quotes"
      />

      <Link
        href="/admin/leads/partners"
        className="admin-card block no-underline transition hover:shadow-lg"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ocean">
          B2B outreach
        </p>
        <p className="mt-1 text-lg font-bold text-navy">Landlord & STR call list</p>
        <p className="mt-1 text-sm text-charcoal/70">
          Pre-loaded PMs and Airbnb managers near 33407 — tap to call, track follow-ups.
        </p>
      </Link>

      <AdminListToolbar />

      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search name, phone, service, address…"
          className="min-h-[48px] flex-1 rounded-xl border border-navy/15 px-4 text-base"
        />
        {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        {lifecycle.showArchived ? <input type="hidden" name="archived" value="1" /> : null}
        <button type="submit" className="admin-btn min-h-[48px] px-4">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href={search ? `/admin/leads?q=${encodeURIComponent(search)}${lifecycle.showArchived ? "&archived=1" : ""}` : lifecycle.showArchived ? "/admin/leads?archived=1" : "/admin/leads"}
          className={`min-h-[44px] rounded-full px-3 py-2 text-xs font-semibold no-underline ${
            status === "all" ? "bg-navy text-cream" : "border border-navy/15 bg-white text-navy"
          }`}
        >
          All ({allLeads.length})
        </Link>
        {LEAD_STATUSES.map((s) => {
          const href = `/admin/leads?status=${s}${search ? `&q=${encodeURIComponent(search)}` : ""}${lifecycle.showArchived ? "&archived=1" : ""}`;
          return (
            <Link
              key={s}
              href={href}
              className={`min-h-[44px] rounded-full px-3 py-2 text-xs font-semibold no-underline ${
                status === s ? "bg-navy text-cream" : "border border-navy/15 bg-white text-navy"
              }`}
            >
              {LEAD_STATUS_LABELS[s]} ({statusCounts[s] ?? 0})
            </Link>
          );
        })}
      </div>

      <ul className="space-y-3">
        {!leads.length ? (
          <EmptyState>
            {search || status !== "all"
              ? "No leads match your filters."
              : "No quote requests yet. Submissions from /quote will appear here."}
          </EmptyState>
        ) : (
          leads.map((lead) => (
            <li key={lead.id} className="admin-card min-h-[88px]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="font-semibold text-navy no-underline hover:underline"
                  >
                    {lead.name}
                  </Link>
                  <p className="mt-1 text-xs text-charcoal/60">
                    {lead.service_requested} · {lead.address}
                    {lead.city ? `, ${lead.city}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-charcoal/50">
                    {formatDate(lead.created_at)}
                    {lead.preferred_date ? ` · Pref. ${formatDate(lead.preferred_date)}` : ""}
                    {lead.preferred_time ? ` ${lead.preferred_time}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <EntityLifecycleMenu
                    entityType="lead"
                    entityId={lead.id}
                    entityLabel={lead.name}
                    isArchived={rowIsArchived(lead as { archived_at?: string | null; archived?: boolean })}
                    isDeleted={rowIsDeleted(lead as { deleted_at?: string | null })}
                  />
                  <span className={`admin-chip shrink-0 ${leadStatusClass(lead.status)}`}>
                    {LEAD_STATUS_LABELS[lead.status as LeadStatus] ?? lead.status}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a href={phoneTel(lead.phone)} className="admin-btn-secondary min-h-[44px] px-3 text-xs no-underline">
                  Call
                </a>
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-ocean no-underline"
                >
                  Open lead →
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
