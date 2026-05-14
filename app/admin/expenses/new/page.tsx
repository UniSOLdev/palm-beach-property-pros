import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { EXPENSE_CATEGORIES, EXPENSE_TYPES, SERVICE_TYPES } from "@/lib/admin/constants";
import { createExpenseAction } from "@/lib/admin/actions";
import { listJobs } from "@/lib/admin/queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

const PAYMENT_OPTIONS = ["Cash", "Zelle", "Card", "Check", "Square Invoice", "Other"] as const;

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; saved?: string }>;
}) {
  const sp = await searchParams;
  const useDb = isSupabaseServerConfigured();
  const jobs = useDb ? await listJobs() : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Add expense"
        subtitle="Tag job-specific costs for honest per-job profit. Route bulk chemical buys through Reusable supplies or Equipment so one Costco run does not look like a job loss."
        actions={
          <Link href="/admin/expenses" className="btn-secondary no-underline">
            Back to expenses
          </Link>
        }
      />

      {sp.err ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{sp.err}</div>
      ) : null}

      <Card title="Expense types (quick guide)">
        <ul className="grid gap-2 text-sm text-charcoal/80 md:grid-cols-2">
          <li>
            <span className="font-semibold text-navy">Job-specific</span> — gas to the job, parking, job-only chemicals,
            dump tickets tied to that address.
          </li>
          <li>
            <span className="font-semibold text-navy">Reusable supplies</span> — stock for the van/shop that serves many
            jobs.
          </li>
          <li>
            <span className="font-semibold text-navy">Equipment investment</span> — pressure washer parts, vacuums,
            long-life tools.
          </li>
          <li>
            <span className="font-semibold text-navy">Overhead</span> — software, marketing, storage, non-field spend.
          </li>
        </ul>
      </Card>

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
              <select
                name="category"
                className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Expense type</span>
              <select
                name="expense_type"
                className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              >
                {EXPENSE_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Service type (optional)</span>
              <select name="service_type" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2">
                <option value="">Infer from linked job, or pick manually</option>
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Vendor / store</span>
              <input
                name="vendor"
                required
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Item / description</span>
              <input
                name="description"
                required
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Payment method</span>
              <select
                name="payment_method"
                className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              >
                {PAYMENT_OPTIONS.map((m) => (
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
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Receipt / photo URL</span>
              <input
                name="receipt_url"
                placeholder="https://…"
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
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
