"use client";

import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { EXPENSE_CATEGORIES, EXPENSE_TYPES } from "@/lib/admin/constants";
import { adminSeed } from "@/lib/admin/seed";

export default function NewExpensePage() {
  return (
    <div>
      <AdminPageHeader
        title="Add expense"
        subtitle="Tag job-specific costs to keep per-job profit honest."
        actions={
          <Link href="/admin/expenses" className="btn-secondary no-underline">
            Cancel
          </Link>
        }
      />
      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Date</span>
            <input type="date" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Amount</span>
            <input type="number" min={0} step={0.01} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Category</span>
            <select className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Expense type</span>
            <select className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
              {EXPENSE_TYPES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Vendor</span>
            <input className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Item / description</span>
            <input className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Payment method</span>
            <select className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
              {["Cash", "Zelle", "Card", "Check", "Other"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Related job</span>
            <select className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
              <option value="">None</option>
              {adminSeed.jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.id} — {j.serviceType}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-navy/25" />
            <span className="text-sm text-charcoal/80">Reimbursable</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-navy/25" />
            <span className="text-sm text-charcoal/80">Reimbursed</span>
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Receipt / photo</span>
            <input type="file" className="mt-1 w-full text-sm" />
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Notes</span>
            <textarea rows={3} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
          </label>
          <div className="md:col-span-2 rounded-xl border border-sky bg-sky/40 px-4 py-3 text-sm text-navy">
            Mock mode: maps to <code className="rounded bg-white/60 px-1">expenses</code> with optional storage for receipts.
          </div>
          <button type="button" className="btn-primary md:col-span-2">
            Save expense (coming with DB)
          </button>
        </form>
      </Card>
    </div>
  );
}
