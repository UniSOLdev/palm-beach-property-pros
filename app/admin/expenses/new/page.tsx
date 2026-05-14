import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { EXPENSE_CATEGORIES, EXPENSE_TYPES } from "@/lib/admin/constants";
import { createExpenseAction } from "@/lib/admin/actions";
import { listJobs } from "@/lib/admin/queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default async function NewExpensePage() {
  const useDb = isSupabaseServerConfigured();
  const jobs = useDb ? await listJobs() : [];

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
        {useDb ? (
          <form action={createExpenseAction} className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Date</span>
              <input
                type="date"
                name="expense_date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Amount</span>
              <input
                type="number"
                name="amount"
                min={0}
                step={0.01}
                required
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Category</span>
              <select name="category" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Expense type</span>
              <select name="expense_type" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
                {EXPENSE_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Vendor</span>
              <input name="vendor" required className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Item / description</span>
              <input name="description" required className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Payment method</span>
              <select name="payment_method" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
                {["Cash", "Zelle", "Card", "Check", "Other"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Related job</span>
              <select name="job_id" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
                <option value="">None</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.serviceType} · {j.date}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="reimbursable" className="h-4 w-4 rounded border-navy/25" />
              <span className="text-sm text-charcoal/80">Reimbursable</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="reimbursed" className="h-4 w-4 rounded border-navy/25" />
              <span className="text-sm text-charcoal/80">Reimbursed</span>
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Receipt URL</span>
              <input name="receipt_url" placeholder="https://…" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Notes</span>
              <textarea name="notes" rows={3} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2" />
            </label>
            <button type="submit" className="btn-primary md:col-span-2">
              Save expense
            </button>
          </form>
        ) : (
          <p className="text-sm text-charcoal/70">Configure Supabase to log expenses.</p>
        )}
      </Card>
    </div>
  );
}
