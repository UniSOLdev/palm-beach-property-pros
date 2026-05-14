import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, Card, StatusBadge } from "@/components/admin/ui";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { getClientById, listInvoices, listJobs, listQuotes } from "@/lib/admin/queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";
import { CLIENT_TYPES } from "@/lib/admin/constants";
import { archiveClientAction, updateClientAction } from "@/lib/admin/actions";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, jobs, quotes, invoices] = await Promise.all([
    getClientById(id),
    listJobs(),
    listQuotes(),
    listInvoices(),
  ]);
  if (!client) notFound();

  const clientJobs = jobs.filter((j) => j.clientId === id);
  const clientQuotes = quotes.filter((q) => q.clientId === id);
  const clientInvoices = invoices.filter((i) => i.clientId === id);
  const revenue = clientJobs.reduce((acc, j) => acc + j.revenue, 0);
  const jobsDone = clientJobs.filter((j) => ["Completed", "Paid"].includes(j.status)).length;
  const useDb = isSupabaseServerConfigured();

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
              <span className="font-semibold text-navy">{clientQuotes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/70">Invoices</span>
              <span className="font-semibold text-navy">{clientInvoices.length}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Recent jobs">
          <ul className="divide-y divide-navy/10">
            {clientJobs.slice(0, 6).map((j) => (
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
                {clientQuotes.map((q) => (
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
                {clientInvoices.map((inv) => (
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

      {useDb ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card title="Edit client">
            <form action={updateClientAction} className="grid gap-3 md:grid-cols-2 text-sm">
              <input type="hidden" name="id" value={client.id} />
              <label className="md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Name</span>
                <input
                  name="name"
                  defaultValue={client.name}
                  required
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Phone</span>
                <input
                  name="phone"
                  defaultValue={client.phone}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Email</span>
                <input
                  name="email"
                  type="email"
                  defaultValue={client.email}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <label className="md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Address</span>
                <input
                  name="address"
                  defaultValue={client.address}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Client type</span>
                <select
                  name="client_type"
                  defaultValue={client.clientType}
                  className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2 outline-none ring-ocean/30 focus:ring-2"
                >
                  {CLIENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Referral source</span>
                <input
                  name="referral_source"
                  defaultValue={client.referralSource}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Follow-up date</span>
                <input
                  type="date"
                  name="follow_up_date"
                  defaultValue={client.followUpDate ?? ""}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Review status</span>
                <select
                  name="review_status"
                  defaultValue={client.reviewStatus}
                  className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2 outline-none ring-ocean/30 focus:ring-2"
                >
                  <option value="Not sent">Not sent</option>
                  <option value="Sent">Sent</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Notes</span>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={client.notes}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <button type="submit" className="btn-primary md:col-span-2">
                Save changes
              </button>
            </form>
          </Card>
          <Card title="Archive">
            <form action={archiveClientAction} className="text-sm">
              <input type="hidden" name="id" value={client.id} />
              <p className="text-charcoal/70">Soft-archive this client. Linked history stays in the database.</p>
              <button type="submit" className="btn-secondary mt-3">
                Archive client
              </button>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
