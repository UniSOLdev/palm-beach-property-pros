import Link from "next/link";
import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { fromSupabase } from "@/lib/admin/db-query";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { logAdminError } from "@/lib/admin/logger";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quotes" };

export default async function AdminQuotesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*, clients(name)")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  const query = fromSupabase(data, error, { route: "/admin/quotes", query: "quotes list" });

  if (!query.ok) {
    logAdminError("quotes list failed", new Error(query.error), { route: "/admin/quotes" });
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Quotes" subtitle="Estimates linked to leads and clients" />
        <LoadError title="Could not load quotes" message={query.error} retryHref="/admin/quotes" />
      </div>
    );
  }

  const quotes = query.data ?? [];
  const quoteIds = quotes.map((q) => q.id);
  const leadByQuoteId = new Map<string, string>();

  if (quoteIds.length) {
    const { data: linkedLeads } = await supabase
      .from("quote_requests")
      .select("id, quote_id")
      .in("quote_id", quoteIds)
      .eq("archived", false);

    for (const row of linkedLeads ?? []) {
      if (row.quote_id) leadByQuoteId.set(row.quote_id, row.id);
    }
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Quotes"
        subtitle="Estimates — convert from leads or share public links"
        actionHref="/admin/leads"
        actionLabel="Leads"
      />

      <ul className="space-y-3">
        {!quotes.length ? (
          <EmptyState>No quotes yet. Convert a lead to create an estimate.</EmptyState>
        ) : (
          quotes.map((quote) => {
            const client =
              quote.clients && typeof quote.clients === "object" && "name" in quote.clients
                ? String((quote.clients as { name: string }).name)
                : "Client";
            const publicUrl = `${SITE_URL}/view/quote/${quote.public_id}`;
            const leadId = leadByQuoteId.get(quote.id);

            return (
              <li key={quote.id} className="admin-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy">{quote.quote_number}</p>
                    <p className="text-xs text-charcoal/60">
                      {client} · {quote.service_type} · {formatDate(quote.created_at)}
                    </p>
                    <p className="mt-1 text-xs text-charcoal/50">{quote.job_address}</p>
                  </div>
                  <span className="admin-chip bg-sky/50 text-navy">{quote.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-ocean no-underline hover:underline"
                  >
                    Public link →
                  </a>
                  {leadId ? (
                    <Link
                      href={`/admin/leads/${leadId}`}
                      className="font-semibold text-charcoal/70 no-underline hover:underline"
                    >
                      Source lead →
                    </Link>
                  ) : (
                    <Link href="/admin/leads" className="font-semibold text-charcoal/70 no-underline hover:underline">
                      View leads
                    </Link>
                  )}
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
