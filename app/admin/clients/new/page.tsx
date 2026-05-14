import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { CLIENT_TYPES } from "@/lib/admin/constants";
import { createClientAction } from "@/lib/admin/actions";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default function NewClientPage() {
  const useDb = isSupabaseServerConfigured();

  return (
    <div>
      <AdminPageHeader
        title="New client"
        subtitle="Capture the basics once — quotes, jobs, and invoices inherit this record."
        actions={
          <Link href="/admin/clients" className="btn-secondary no-underline">
            Cancel
          </Link>
        }
      />
      <Card>
        {useDb ? (
          <form action={createClientAction} className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Name</span>
              <input
                name="name"
                required
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Phone</span>
              <input name="phone" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Email</span>
              <input
                type="email"
                name="email"
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Address</span>
              <input name="address" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Client type</span>
              <select
                name="client_type"
                className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
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
              <input name="referral_source" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Follow-up date</span>
              <input type="date" name="follow_up_date" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Review status</span>
              <select
                name="review_status"
                defaultValue="Not sent"
                className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              >
                <option value="Not sent">Not sent</option>
                <option value="Sent">Sent</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Notes</span>
              <textarea name="notes" rows={3} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <button type="submit" className="btn-primary md:col-span-2">
              Save client
            </button>
          </form>
        ) : (
          <p className="text-sm text-charcoal/70">Configure Supabase to create live client records.</p>
        )}
      </Card>
    </div>
  );
}
