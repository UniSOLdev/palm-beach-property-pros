import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { NewQuoteSeedClient } from "@/components/admin/new-quote-seed-client";
import { SERVICE_TYPES } from "@/lib/admin/constants";
import { createDraftQuoteAction } from "@/lib/admin/actions";
import { listClients } from "@/lib/admin/queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default async function NewQuotePage() {
  const clients = await listClients();
  const dataMode = isSupabaseServerConfigured() ? "supabase" : "seed";

  if (dataMode === "supabase") {
    return (
      <div>
        <AdminPageHeader
          title="New quote"
          subtitle="Create a draft in Supabase, then refine line items on the next screen."
          actions={
            <Link href="/admin/quotes" className="btn-secondary no-underline">
              Back
            </Link>
          }
        />
        <Card>
          <form action={createDraftQuoteAction} className="grid gap-4 md:grid-cols-2">
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
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Job address</span>
              <input
                name="job_address"
                required
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
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
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Expiration</span>
              <input type="date" name="expiration_date" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" name="deposit_required" className="h-4 w-4 rounded border-navy/25" />
              <span className="text-sm text-charcoal/80">Deposit required</span>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Deposit amount</span>
              <input
                type="number"
                name="deposit_amount"
                min={0}
                step={1}
                defaultValue={0}
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Notes</span>
              <textarea name="notes" rows={3} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Terms</span>
              <textarea name="terms" rows={3} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Internal notes</span>
              <textarea name="internal_notes" rows={2} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Starter line item label</span>
              <input
                name="starter_line"
                placeholder="Primary service"
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary">
                Create draft quote
              </button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return <NewQuoteSeedClient />;
}
