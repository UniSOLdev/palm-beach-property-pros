import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { EXPENSE_CATEGORIES, EXPENSE_TYPES, SERVICE_TYPES } from "@/lib/admin/constants";
import { archiveExpenseAction, updateExpenseAction } from "@/lib/admin/actions";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { getExpenseById, listJobs } from "@/lib/admin/queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

const PAYMENT_OPTIONS = ["Cash", "Zelle", "Card", "Check", "Square Invoice", "Other"] as const;

export default async function EditExpensePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; err?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const useDb = isSupabaseServerConfigured();
  const expense = await getExpenseById(id);
  if (!expense) notFound();
  const jobs = useDb ? await listJobs() : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Edit expense"
        subtitle={`Logged ${formatDate(expense.date)} · ${formatCurrency(expense.amount)}`}
        actions={
          <Link href="/admin/expenses" className="btn-secondary no-underline">
            Back to expenses
          </Link>
        }
      />

      {(sp.err || sp.saved) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            sp.err ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {sp.err ?? "Changes saved."}
        </div>
      )}

      <Card>
        {useDb ? (
          <div className="space-y-6">
            <form action={updateExpenseAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="id" value={expense.id} />
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Date</span>
                <input
                  type="date"
                  name="expense_date"
                  required
                  defaultValue={expense.date}
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
                  defaultValue={expense.amount}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Category</span>
                <select
                  name="category"
                  defaultValue={expense.category}
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
                  defaultValue={expense.expenseType}
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
                <select
                  name="service_type"
                  defaultValue={expense.serviceType ?? ""}
                  className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                >
                  <option value="">Infer from job, or select manually</option>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-charcoal/55">Leave blank to copy the linked job&apos;s service type when you save.</p>
              </label>
              <label className="md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Vendor</span>
                <input
                  name="vendor"
                  required
                  defaultValue={expense.vendor}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <label className="md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Item / description</span>
                <input
                  name="description"
                  required
                  defaultValue={expense.description}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Payment method</span>
                <select
                  name="payment_method"
                  defaultValue={expense.paymentMethod}
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
                <select
                  name="job_id"
                  defaultValue={expense.jobId ?? ""}
                  className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                >
                  <option value="">None</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.serviceType} · {j.date}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="reimbursable" defaultChecked={expense.reimbursable} className="h-4 w-4 rounded border-navy/25" />
                <span className="text-sm text-charcoal/80">Reimbursable</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="reimbursed" defaultChecked={expense.reimbursed} className="h-4 w-4 rounded border-navy/25" />
                <span className="text-sm text-charcoal/80">Reimbursed</span>
              </label>
              <label className="md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Receipt URL</span>
                <input
                  name="receipt_url"
                  defaultValue={expense.receiptUrl ?? ""}
                  placeholder="https://…"
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <label className="md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Notes</span>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={expense.notes}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <button type="submit" className="btn-primary md:col-span-2">
                Save changes
              </button>
            </form>

            <div className="border-t border-navy/10 pt-6">
              <h3 className="text-sm font-bold text-navy">Archive expense</h3>
              <p className="mt-1 text-xs text-charcoal/60">Removes this row from active reports. This cannot be undone from the UI.</p>
              <form action={archiveExpenseAction} className="mt-3">
                <input type="hidden" name="id" value={expense.id} />
                <button type="submit" className="btn-secondary text-rose-800 ring-rose-200">
                  Archive
                </button>
              </form>
            </div>
          </div>
        ) : (
          <p className="text-sm text-charcoal/70">Configure Supabase to edit expenses.</p>
        )}
      </Card>
    </div>
  );
}
