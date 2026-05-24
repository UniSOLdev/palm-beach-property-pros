import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { LeadDetailActions } from "@/components/admin/lead-detail-actions";
import { LoadError } from "@/components/admin/load-error";
import { getLead, getLeadPhotoUrls } from "@/lib/admin/actions/leads";
import { LEAD_STATUS_LABELS, leadStatusClass } from "@/lib/admin/lead-constants";
import { logAdminError } from "@/lib/admin/logger";
import { formatDate } from "@/lib/admin/format";
import type { LeadStatus } from "@/lib/admin/lead-constants";
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
    const { lead } = await getLead(id);
    return { title: `Lead · ${lead.name}` };
  } catch {
    return { title: "Lead" };
  }
}

export default async function AdminLeadDetailPage({ params }: Props) {
  const { id } = await params;

  let leadData: Awaited<ReturnType<typeof getLead>> | null = null;
  let loadError = "";

  try {
    leadData = await getLead(id);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load lead";
    logAdminError("lead detail failed", e, { route: `/admin/leads/${id}` });
  }

  if (loadError) {
    if (loadError === "Lead not found") notFound();
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Lead" subtitle="Quote request detail" />
        <LoadError title="Could not load lead" message={loadError} retryHref={`/admin/leads/${id}`} />
      </div>
    );
  }

  if (!leadData) notFound();

  const { lead, activity, quotePublicId, quoteMeta } = leadData;
  const photos = await getLeadPhotoUrls(lead.photo_urls);
  const quotePublicUrl = quotePublicId ? `${SITE_URL}/view/quote/${quotePublicId}` : null;
  const quoteApproval = quoteMeta?.approval_status as QuoteApprovalStatus | undefined;

  return (
    <div className="space-y-4">
      <Link href="/admin/leads" className="text-sm font-semibold text-ocean no-underline hover:underline">
        ← All leads
      </Link>

      <AdminPageHeader
        title={lead.name}
        subtitle={`${lead.service_requested} · ${formatDate(lead.created_at)}`}
      />

      <div className="admin-card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`admin-chip ${leadStatusClass(lead.status)}`}>
            {LEAD_STATUS_LABELS[lead.status as LeadStatus] ?? lead.status}
          </span>
          <span className="text-xs text-charcoal/50">Source: {lead.source}</span>
        </div>

        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-charcoal/60">Phone</dt>
            <dd className="font-medium text-navy">{lead.phone}</dd>
          </div>
          {lead.email ? (
            <div>
              <dt className="text-charcoal/60">Email</dt>
              <dd className="font-medium text-navy">{lead.email}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-charcoal/60">Address</dt>
            <dd className="font-medium text-navy">
              {lead.address}
              {lead.city ? `, ${lead.city}` : ""}
            </dd>
          </div>
          {lead.property_type ? (
            <div>
              <dt className="text-charcoal/60">Property type</dt>
              <dd>{lead.property_type}</dd>
            </div>
          ) : null}
          {lead.preferred_contact ? (
            <div>
              <dt className="text-charcoal/60">Preferred contact</dt>
              <dd>{lead.preferred_contact}</dd>
            </div>
          ) : null}
          {lead.preferred_date || lead.preferred_time ? (
            <div>
              <dt className="text-charcoal/60">Preferred scheduling</dt>
              <dd>
                {[lead.preferred_date ? formatDate(lead.preferred_date) : null, lead.preferred_time]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </div>
          ) : null}
          {lead.message ? (
            <div>
              <dt className="text-charcoal/60">Details</dt>
              <dd className="whitespace-pre-wrap text-charcoal/90">{lead.message}</dd>
            </div>
          ) : null}
          {lead.referrer ? (
            <div>
              <dt className="text-charcoal/60">Referrer</dt>
              <dd className="break-all text-xs">{lead.referrer}</dd>
            </div>
          ) : null}
        </dl>

        {(lead.client_id || lead.quote_id || lead.invoice_id) && (
          <div className="border-t border-navy/10 pt-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">Linked records</p>
            <ul className="mt-2 space-y-1">
              {lead.client_id ? (
                <li>
                  <Link href="/admin/clients" className="text-ocean no-underline hover:underline">
                    Client record
                  </Link>
                </li>
              ) : null}
              {lead.quote_id && quotePublicUrl ? (
                <li>
                  <a href={quotePublicUrl} target="_blank" rel="noopener noreferrer" className="text-ocean no-underline hover:underline">
                    Public quote link
                  </a>
                  {quoteApproval ? (
                    <>
                      {" · "}
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${quoteApprovalClass(quoteApproval)}`}>
                        {QUOTE_APPROVAL_LABELS[quoteApproval]}
                      </span>
                    </>
                  ) : null}
                  {" · "}
                  <Link href={`/admin/quotes/${lead.quote_id}`} className="text-ocean no-underline hover:underline">
                    Admin quote
                  </Link>
                </li>
              ) : lead.quote_id ? (
                <li>
                  <Link href="/admin/quotes" className="text-ocean no-underline hover:underline">
                    Quote estimate
                  </Link>
                </li>
              ) : null}
              {lead.invoice_id ? (
                <li>
                  <Link href={`/admin/invoices/${lead.invoice_id}`} className="text-ocean no-underline hover:underline">
                    Invoice draft
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        )}
      </div>

      {photos.length ? (
        <section className="admin-card">
          <h2 className="text-sm font-semibold text-navy">Photos ({photos.length})</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((photo) => (
              <li key={photo.path}>
                <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-navy/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="Lead photo" className="aspect-square w-full object-cover" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="admin-card">
        <h2 className="text-sm font-semibold text-navy">Actions</h2>
        <div className="mt-3">
          <LeadDetailActions
            leadId={lead.id}
            currentStatus={lead.status}
            hasClient={Boolean(lead.client_id)}
            hasQuote={Boolean(lead.quote_id)}
            hasInvoice={Boolean(lead.invoice_id)}
            quotePublicUrl={quotePublicUrl}
            quoteId={lead.quote_id}
            quoteApprovalStatus={quoteMeta?.approval_status ?? null}
            phone={lead.phone}
            email={lead.email}
          />
        </div>
      </section>

      <section className="admin-card">
        <h2 className="text-sm font-semibold text-navy">Activity</h2>
        {!activity.length ? (
          <p className="mt-2 text-sm text-charcoal/60">No activity yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {activity.map((item) => (
              <li key={item.id} className="border-b border-navy/5 pb-3 last:border-0">
                <p className="text-xs text-charcoal/50">
                  {formatDate(item.created_at)} · {item.activity_type.replace("_", " ")}
                </p>
                {item.body ? <p className="mt-1 text-sm text-charcoal/90">{item.body}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-charcoal/50">
        Public quote form: {SITE_URL}/quote
      </p>
    </div>
  );
}
