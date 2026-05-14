import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, Card, StatusBadge } from "@/components/admin/ui";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { adminSeed, getClientById } from "@/lib/admin/seed";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClientById(id);
  if (!client) notFound();

  const jobs = adminSeed.jobs.filter((j) => j.clientId === id);
  const quotes = adminSeed.quotes.filter((q) => q.clientId === id);
  const invoices = adminSeed.invoices.filter((i) => i.clientId === id);
  const revenue = jobs.reduce((acc, j) => acc + j.revenue, 0);
  const jobsDone = jobs.filter((j) => ["Completed", "Paid"].includes(j.status)).length;

  return (
    <div>
      <AdminPageHeader
        title={client.name}
        subtitle="CRM record with revenue context and follow-ups."
        actions={
          <Link href="/admin/clients" className="btn-secondary no-underline">
            All clients
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Contact" className="lg:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Phone</dt>
              <dd className="mt-1 font-semibold text-navy">{client.phone}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Email</dt>
              <dd className="mt-1 font-semibold text-navy">{client.email}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Address</dt>
              <dd className="mt-1 text-charcoal">{client.address}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Client type</dt>
              <dd className="mt-1 text-charcoal">{client.clientType}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Referral source</dt>
              <dd className="mt-1 text-charcoal">{client.referralSource}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Follow-up date</dt>
              <dd className="mt-1 text-charcoal">{client.followUpDate ? formatDate(client.followUpDate) : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Review status</dt>
              <dd className="mt-1">
                <StatusBadge status={client.reviewStatus} />
              </dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-navy/10 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Notes</div>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/80">{client.notes || "—"}</p>
          </div>
        </Card>

        <Card title="Snapshot">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal/70">Total revenue (jobs)</span>
              <span className="font-semibold text-navy">{formatCurrency(revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/70">Jobs completed</span>
              <span className="font-semibold text-navy">{jobsDone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/70">Quotes</span>
              <span className="font-semibold text-navy">{quotes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/70">Invoices</span>
              <span className="font-semibold text-navy">{invoices.length}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Recent jobs">
          <ul className="divide-y divide-navy/10">
            {jobs.slice(0, 6).map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <div>
                  <div className="font-semibold text-navy">{j.serviceType}</div>
                  <div className="text-xs text-charcoal/55">
                    {formatDate(j.date)} · {j.status}
                  </div>
                </div>
                <Link href={`/admin/jobs/${j.id}`} className="text-sm font-semibold text-ocean no-underline">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Quotes & invoices">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-navy/60">Quotes</div>
              <ul className="mt-2 space-y-2 text-sm">
                {quotes.map((q) => (
                  <li key={q.id}>
                    <Link className="font-semibold text-ocean no-underline" href={`/admin/quotes/${q.id}`}>
                      {q.quoteNumber}
                    </Link>
                    <div className="text-xs text-charcoal/55">{q.status}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-navy/60">Invoices</div>
              <ul className="mt-2 space-y-2 text-sm">
                {invoices.map((inv) => (
                  <li key={inv.id}>
                    <Link className="font-semibold text-ocean no-underline" href={`/admin/invoices/${inv.id}`}>
                      {inv.invoiceNumber}
                    </Link>
                    <div className="text-xs text-charcoal/55">{inv.paymentStatus}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
