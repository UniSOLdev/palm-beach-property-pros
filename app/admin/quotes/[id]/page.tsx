import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { QuoteAdminActions } from "@/components/admin/quote-admin-actions";
import { getQuoteById } from "@/lib/admin/actions/quotes";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { logAdminError } from "@/lib/admin/logger";
import {
  QUOTE_APPROVAL_LABELS,
  quoteApprovalClass,
  type QuoteApprovalStatus,
} from "@/lib/quotes/constants";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const { quote } = await getQuoteById(id);
    return { title: `Quote · ${quote.quote_number}` };
  } catch {
    return { title: "Quote" };
  }
}

export default async function AdminQuoteDetailPage({ params }: Props) {
  const { id } = await params;
  let data: Awaited<ReturnType<typeof getQuoteById>> | null = null;
  let loadError = "";

  try {
    data = await getQuoteById(id);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load quote";
    logAdminError("quote detail page failed", e, { route: `/admin/quotes/${id}` });
  }

  if (loadError) {
    if (loadError === "Quote not found") notFound();
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Quote" subtitle="Estimate detail" />
        <LoadError title="Could not load quote" message={loadError} retryHref={`/admin/quotes/${id}`} />
      </div>
    );
  }

  if (!data) notFound();

  const { quote, items, events, signaturePreviewUrl, pdfDownloadUrl, leadId } = data;
  const approval = (quote.approval_status ?? "pending") as QuoteApprovalStatus;
  const publicUrl = `${SITE_URL}/view/quote/${quote.public_id}`;
  const client = quote.clients;
  const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);

  return (
    <div className="space-y-4">
      <Link href="/admin/quotes" className="text-sm font-semibold text-ocean no-underline hover:underline">
        ← All quotes
      </Link>

      <AdminPageHeader
        title={quote.quote_number}
        subtitle={`${client?.name ?? "Client"} · ${quote.service_type}`}
      />

      <div className="admin-card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`admin-chip ${quoteApprovalClass(approval)}`}>
            {QUOTE_APPROVAL_LABELS[approval] ?? approval}
          </span>
          <span className="admin-chip bg-sky/40 text-navy">{quote.status}</span>
        </div>
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-charcoal/60">Property</dt>
            <dd className="font-medium text-navy">{quote.job_address}</dd>
          </div>
          {quote.sent_at ? (
            <div>
              <dt className="text-charcoal/60">Sent</dt>
              <dd>{formatDate(quote.sent_at)}</dd>
            </div>
          ) : null}
          {quote.viewed_at ? (
            <div>
              <dt className="text-charcoal/60">Viewed</dt>
              <dd>{formatDate(quote.viewed_at)}</dd>
            </div>
          ) : null}
          {quote.signed_at ? (
            <div>
              <dt className="text-charcoal/60">Signed</dt>
              <dd>
                {formatDate(quote.signed_at)}
                {quote.signed_name ? ` · ${quote.signed_name}` : ""}
              </dd>
            </div>
          ) : null}
          {quote.declined_at ? (
            <div>
              <dt className="text-charcoal/60">Declined</dt>
              <dd>{formatDate(quote.declined_at)}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <section className="admin-card">
        <h2 className="text-sm font-semibold text-navy">Actions</h2>
        <div className="mt-3">
          <QuoteAdminActions
            quoteId={quote.id}
            publicUrl={publicUrl}
            clientPhone={client?.phone ?? null}
            clientEmail={client?.email ?? null}
          />
        </div>
        {leadId ? (
          <p className="mt-3 text-sm">
            <Link href={`/admin/leads/${leadId}`} className="font-semibold text-ocean no-underline hover:underline">
              View source lead →
            </Link>
          </p>
        ) : null}
      </section>

      <section className="admin-card">
        <h2 className="text-sm font-semibold text-navy">Line items</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {items.length ? (
            items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2 border-b border-navy/5 pb-2">
                <span>{item.description}</span>
                <span className="font-semibold text-navy shrink-0">
                  {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                </span>
              </li>
            ))
          ) : (
            <li className="text-charcoal/60">No line items</li>
          )}
          <li className="flex justify-between pt-2 font-bold text-navy">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </li>
        </ul>
      </section>

      {signaturePreviewUrl ? (
        <section className="admin-card">
          <h2 className="text-sm font-semibold text-navy">Client signature</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-navy/10 bg-cream/30 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signaturePreviewUrl} alt="Client signature" className="max-h-32 w-full object-contain" />
          </div>
        </section>
      ) : null}

      {pdfDownloadUrl ? (
        <section className="admin-card">
          <a
            href={pdfDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn min-h-[48px] no-underline"
          >
            Download signed PDF
          </a>
        </section>
      ) : null}

      <section className="admin-card">
        <h2 className="text-sm font-semibold text-navy">Activity</h2>
        {!events.length ? (
          <p className="mt-2 text-sm text-charcoal/60">No events yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {events.map((event) => (
              <li key={event.id} className="border-b border-navy/5 pb-3 last:border-0">
                <p className="text-xs text-charcoal/50">
                  {formatDate(event.created_at)} · {event.type}
                </p>
                {event.note ? <p className="mt-1 text-sm text-charcoal/90">{event.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
