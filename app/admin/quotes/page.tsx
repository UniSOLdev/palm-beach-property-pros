import Link from "next/link";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import { EntityLifecycleMenu } from "@/components/admin/entity-lifecycle-menu";
import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { fromSupabase } from "@/lib/admin/db-query";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { applyLifecycleFilters, rowIsArchived, rowIsDeleted } from "@/lib/admin/lifecycle/list-query";
import { lifecycleOptionsFromSearchParams } from "@/lib/admin/lifecycle/search-params";
import { logAdminError } from "@/lib/admin/logger";
import {
  QUOTE_APPROVAL_LABELS,
  quoteApprovalClass,
  type QuoteApprovalStatus,
} from "@/lib/quotes/constants";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quotes" };

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const lifecycle = lifecycleOptionsFromSearchParams({ archived });

  const supabase = await createClient();
  let listQuery = supabase
    .from("quotes")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });
  listQuery = applyLifecycleFilters(listQuery, lifecycle);

  const { data, error } = await listQuery;

  const result = fromSupabase(data, error, { route: "/admin/quotes", query: "quotes list" });

  if (!result.ok) {
    logAdminError("quotes list failed", new Error(result.error), { route: "/admin/quotes" });
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Quotes" subtitle="Estimates linked to leads and clients" />
        <LoadError title="Could not load quotes" message={result.error} retryHref="/admin/quotes" />
      </div>
    );
  }

  const quotes = result.data ?? [];
  const quoteIds = quotes.map((q) => q.id);
  const leadByQuoteId = new Map<string, string>();

  if (quoteIds.length) {
    let leadsQuery = supabase.from("quote_requests").select("id, quote_id").in("quote_id", quoteIds);
    leadsQuery = applyLifecycleFilters(leadsQuery, lifecycle);
    const { data: linkedLeads } = await leadsQuery;

    for (const row of linkedLeads ?? []) {
      if (row.quote_id) leadByQuoteId.set(row.quote_id, row.id);
    }
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Quotes"
        subtitle="Estimates — e-sign, share, and track approval"
        actionHref="/admin/leads"
        actionLabel="Leads"
      />

      <AdminListToolbar />

      <ul className="space-y-3">
        {!quotes.length ? (
          <EmptyState>{lifecycle.showArchived ? "No archived quotes." : "No quotes yet. Convert a lead to create an estimate."}</EmptyState>
        ) : (
          quotes.map((quote) => {
            const client =
              quote.clients && typeof quote.clients === "object" && "name" in quote.clients
                ? String((quote.clients as { name: string }).name)
                : "Client";
            const publicUrl = `${SITE_URL}/view/quote/${quote.public_id}`;
            const leadId = leadByQuoteId.get(quote.id);
            const approval = (quote.approval_status ?? "pending") as QuoteApprovalStatus;

            return (
              <li key={quote.id} className="admin-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/admin/quotes/${quote.id}`}
                      className="font-semibold text-navy no-underline hover:underline"
                    >
                      {quote.quote_number}
                    </Link>
                    <p className="text-xs text-charcoal/60">
                      {client} · {quote.service_type} · {formatDate(quote.created_at)}
                    </p>
                    <p className="mt-1 text-xs text-charcoal/50">{quote.job_address}</p>
                    {quote.signed_at ? (
                      <p className="mt-1 text-xs text-leaf font-medium">
                        Signed {formatDate(quote.signed_at)}
                        {quote.signed_name ? ` · ${quote.signed_name}` : ""}
                      </p>
                    ) : quote.viewed_at ? (
                      <p className="mt-1 text-xs text-charcoal/50">Viewed {formatDate(quote.viewed_at)}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <EntityLifecycleMenu
                      entityType="quote"
                      entityId={quote.id}
                      entityLabel={quote.quote_number}
                      isArchived={rowIsArchived(quote as { archived_at?: string | null; archived?: boolean })}
                      isDeleted={rowIsDeleted(quote as { deleted_at?: string | null })}
                    />
                    <span className={`admin-chip ${quoteApprovalClass(approval)}`}>
                      {QUOTE_APPROVAL_LABELS[approval] ?? approval}
                    </span>
                    <span className="admin-chip bg-sky/40 text-navy text-[10px]">{quote.status}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <Link
                    href={`/admin/quotes/${quote.id}`}
                    className="font-semibold text-ocean no-underline hover:underline"
                  >
                    Open →
                  </Link>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-charcoal/70 no-underline hover:underline"
                  >
                    Public link
                  </a>
                  {leadId ? (
                    <Link
                      href={`/admin/leads/${leadId}`}
                      className="font-semibold text-charcoal/70 no-underline hover:underline"
                    >
                      Source lead
                    </Link>
                  ) : null}
                </div>
                {quote.deposit_required ? (
                  <p className="mt-2 text-xs text-charcoal/60">
                    Deposit: {formatCurrency(Number(quote.deposit_amount))}
                  </p>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
