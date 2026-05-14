import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, Card, StatusBadge } from "@/components/admin/ui";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { invoiceBalanceDue } from "@/lib/admin/invoice-totals";
import { adminSeed, getClientById, getInvoiceById, getJobById, getQuoteById } from "@/lib/admin/seed";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJobById(id);
  if (!job) notFound();
  const client = getClientById(job.clientId);
  const quote = job.quoteId ? getQuoteById(job.quoteId) : null;
  const invoice = job.invoiceId ? getInvoiceById(job.invoiceId) : null;
  const crew = job.assignedCrewIds
    .map((cid) => adminSeed.crewMembers.find((m) => m.id === cid)?.name)
    .filter(Boolean)
    .join(", ");

  const profit = job.revenue - job.jobExpenseTotal;

  return (
    <div>
      <AdminPageHeader
        title={`Job ${job.id}`}
        subtitle={job.address}
        actions={
          <Link href="/admin/jobs" className="btn-secondary no-underline">
            All jobs
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Overview" className="lg:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Client</dt>
              <dd className="mt-1 font-semibold text-navy">{client?.name}</dd>
              <dd className="text-sm text-charcoal/70">{client?.email}</dd>
              <dd className="text-sm text-charcoal/70">{client?.phone}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Status</dt>
              <dd className="mt-1">
                <StatusBadge status={job.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Service</dt>
              <dd className="mt-1 text-charcoal">{job.serviceType}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Schedule</dt>
              <dd className="mt-1 text-charcoal">
                {formatDate(job.date)} · {job.startTime}–{job.endTime}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Address</dt>
              <dd className="mt-1 text-charcoal">{job.address}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Assigned crew</dt>
              <dd className="mt-1 text-charcoal">{crew || "Unassigned"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Referral source</dt>
              <dd className="mt-1 text-charcoal">{job.referralSource}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Money">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal/70">Revenue</span>
              <span className="font-semibold text-navy">{formatCurrency(job.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/70">Job expenses</span>
              <span className="font-semibold text-navy">{formatCurrency(job.jobExpenseTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-navy/10 pt-3">
              <span className="text-charcoal/70">Est. profit</span>
              <span className="font-semibold text-leaf">{formatCurrency(profit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/70">Payment method</span>
              <span className="font-semibold text-navy">{job.paymentMethod ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/70">Review requested</span>
              <span className="font-semibold text-navy">{job.reviewRequested ? "Yes" : "No"}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Job notes">
          <p className="text-sm leading-relaxed text-charcoal/80">{job.jobNotes || "—"}</p>
          <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-navy/60">Internal notes</h3>
          <p className="mt-2 text-sm leading-relaxed text-charcoal/80">{job.internalNotes || "—"}</p>
        </Card>

        <Card title="Documents & media">
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-navy/60">Quote</div>
              {quote ? (
                <Link className="mt-1 inline-block font-semibold text-ocean no-underline" href={`/admin/quotes/${quote.id}`}>
                  {quote.quoteNumber} ({quote.status})
                </Link>
              ) : (
                <div className="mt-1 text-charcoal/60">None attached</div>
              )}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-navy/60">Invoice</div>
              {invoice ? (
                <div className="mt-1 space-y-1">
                  <Link className="font-semibold text-ocean no-underline" href={`/admin/invoices/${invoice.id}`}>
                    {invoice.invoiceNumber} ({invoice.paymentStatus})
                  </Link>
                  <div className="text-xs text-charcoal/55">
                    Balance due {formatCurrency(invoiceBalanceDue(invoice))}
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-charcoal/60">None attached</div>
              )}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-navy/60">Before photos</div>
              <div className="mt-1 text-charcoal/70">{job.beforePhotoUrls.length ? `${job.beforePhotoUrls.length} on file` : "None yet"}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-navy/60">After photos</div>
              <div className="mt-1 text-charcoal/70">{job.afterPhotoUrls.length ? `${job.afterPhotoUrls.length} on file` : "None yet"}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
