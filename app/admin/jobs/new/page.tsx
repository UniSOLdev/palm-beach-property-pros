"use client";

import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { SERVICE_TYPES } from "@/lib/admin/constants";

export default function NewJobPage() {
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
        <form className="grid gap-4 md:grid-cols-2" action="#" onSubmit={(e) => e.preventDefault()}>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Client</span>
            <select className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
              <option>Neil</option>
              <option>Marina Isles HOA — Office</option>
              <option>Coastal Stays LLC</option>
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Service type</span>
            <select className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
              {SERVICE_TYPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Address</span>
            <input className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Date</span>
            <input type="date" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Start</span>
              <input type="time" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">End</span>
              <input type="time" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
          </div>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Job notes</span>
            <textarea rows={3} className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <div className="md:col-span-2 rounded-xl border border-sky bg-sky/40 px-4 py-3 text-sm text-navy">
            Mock mode: connect Supabase to persist jobs. This form matches the intended{" "}
            <code className="rounded bg-white/60 px-1">jobs</code> table fields.
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button type="button" className="btn-primary">
              Save draft (coming with DB)
            </button>
            <button type="button" className="btn-secondary">
              Attach quote
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
