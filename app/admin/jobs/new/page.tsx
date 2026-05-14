import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { SERVICE_TYPES } from "@/lib/admin/constants";
import { createJobAction } from "@/lib/admin/actions";
import { listClients, listCrewMembers, listInvoices, listQuotes } from "@/lib/admin/queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default async function NewJobPage() {
  const useDb = isSupabaseServerConfigured();
  const [clients, quotes, invoices, crew] = useDb
    ? await Promise.all([listClients(), listQuotes(), listInvoices(), listCrewMembers()])
    : [[], [], [], []];

  return (
    <div>
      <AdminPageHeader
        title="Create job"
        subtitle="Capture the job once — crew sees schedule, office sees profitability."
        actions={
          <Link href="/admin/jobs" className="btn-secondary no-underline">
            Cancel
          </Link>
        }
      />

      <Card>
        {useDb ? (
          <form action={createJobAction} className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Client</span>
              <select
                name="client_id"
                required
                className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                defaultValue={clients[0]?.id}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Service type</span>
              <select
                name="service_type"
                className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Address</span>
              <input name="address" required className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Date</span>
              <input
                type="date"
                name="job_date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Start</span>
                <input type="time" name="start_time" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">End</span>
                <input type="time" name="end_time" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
              </label>
            </div>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Status</span>
              <select name="status" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
                <option>Lead</option>
                <option>Quoted</option>
                <option>Approved</option>
                <option>Scheduled</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Paid</option>
                <option>Cancelled</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Revenue</span>
              <input type="number" name="revenue" min={0} step={1} defaultValue={0} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Referral source</span>
              <input name="referral_source" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Quote (optional)</span>
              <select name="quote_id" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
                <option value="">—</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.quoteNumber}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Invoice (optional)</span>
              <select name="invoice_id" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
                <option value="">—</option>
                {invoices.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.invoiceNumber}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Payment method</span>
              <select name="payment_method" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
                <option value="">—</option>
                <option value="Cash">Cash</option>
                <option value="Zelle">Zelle</option>
                <option value="Card">Card</option>
                <option value="Check">Check</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" name="review_requested" className="h-4 w-4 rounded border-navy/25" />
              <span className="text-sm text-charcoal/80">Review requested</span>
            </label>
            <div className="md:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Assigned crew</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {crew.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="assigned_crew" value={m.id} className="h-4 w-4 rounded border-navy/25" />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Job notes</span>
              <textarea name="job_notes" rows={3} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Internal notes</span>
              <textarea name="internal_notes" rows={2} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <button type="submit" className="btn-primary md:col-span-2">
              Save job
            </button>
          </form>
        ) : (
          <p className="text-sm text-charcoal/70">Configure Supabase to create live jobs.</p>
        )}
      </Card>
    </div>
  );
}
