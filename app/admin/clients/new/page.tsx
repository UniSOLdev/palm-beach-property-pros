"use client";

"use client";

import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { CLIENT_TYPES } from "@/lib/admin/constants";

export default function NewClientPage() {
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
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Name</span>
            <input className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Phone</span>
            <input className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Email</span>
            <input type="email" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Address</span>
            <input className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Client type</span>
            <select className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
              {CLIENT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Referral source</span>
            <input className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Notes</span>
            <textarea rows={3} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <div className="md:col-span-2 rounded-xl border border-sky bg-sky/40 px-4 py-3 text-sm text-navy">
            Mock mode: this form maps to the intended <code className="rounded bg-white/60 px-1">clients</code> table.
          </div>
          <button type="button" className="btn-primary md:col-span-2">
            Save client (coming with DB)
          </button>
        </form>
      </Card>
    </div>
  );
}
