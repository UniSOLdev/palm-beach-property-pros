export const dynamic = "force-dynamic";

import Link from "next/link";

import { ExpenseBatchesPanel, type ExpenseBatchListRow } from "@/components/admin/expense-batches-panel";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata = {
  title: "Expenses",
};

function fmtMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type PageProps = { searchParams: Promise<{ imported?: string }> };

export default async function AdminExpensesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const importedBanner = sp.imported === "1";

  let err: string | null = null;
  let total_cents = 0;
  let expense_count = 0;
  let by_category: { category: string; total_cents: number; expense_count: number }[] = [];
  let by_payment: { payment_method: string; total_cents: number; expense_count: number }[] = [];
  let monthly: { month_start: string; total_cents: number; expense_count: number }[] = [];
  let batches: ExpenseBatchListRow[] = [];
  let jobSpend: { job_id: string; label: string; total_cents: number; expense_count: number }[] = [];

  try {
    const supabase = createServiceSupabase();

    const [totRes, catRes, payRes, monRes, batchRes, jobTotRes] = await Promise.all([
      supabase.from("expense_totals_v").select("expense_count, total_cents").maybeSingle(),
      supabase
        .from("expense_analytics_by_category")
        .select("category, total_cents, expense_count")
        .order("total_cents", { ascending: false })
        .limit(12),
      supabase
        .from("expense_analytics_by_payment")
        .select("payment_method, total_cents, expense_count")
        .order("total_cents", { ascending: false })
        .limit(10),
      supabase.from("expense_monthly_totals").select("month_start, total_cents, expense_count").limit(12),
      supabase
        .from("expense_import_batches")
        .select("id, label, source, row_count, inserted_count, skipped_duplicates, skipped_invalid, reverted_at, created_at")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase.from("expense_job_totals").select("job_id, total_cents, expense_count").order("total_cents", { ascending: false }).limit(12),
    ]);

    if (totRes.error) throw totRes.error;
    if (catRes.error) throw catRes.error;
    if (payRes.error) throw payRes.error;
    if (monRes.error) throw monRes.error;
    if (batchRes.error) throw batchRes.error;
    if (jobTotRes.error) throw jobTotRes.error;

    const t = totRes.data as { expense_count?: number; total_cents?: number } | null;
    expense_count = Number(t?.expense_count ?? 0);
    total_cents = Number(t?.total_cents ?? 0);

    by_category = (catRes.data ?? []) as typeof by_category;
    by_payment = (payRes.data ?? []) as typeof by_payment;
    monthly = (monRes.data ?? []) as typeof monthly;
    batches = (batchRes.data ?? []) as ExpenseBatchListRow[];

    const jt = (jobTotRes.data ?? []) as { job_id: string; total_cents: number; expense_count: number }[];
    const jobIds = jt.map((r) => r.job_id).filter(Boolean);
    if (jobIds.length) {
      const { data: jobs, error: jErr } = await supabase
        .from("jobs")
        .select("id, job_number, title, clients ( full_name )")
        .in("id", jobIds);
      if (jErr) throw jErr;
      const labelById = new Map<string, string>();
      for (const row of jobs ?? []) {
        const j = row as Record<string, unknown>;
        const c = j.clients;
        const client_name = Array.isArray(c)
          ? (c[0] as { full_name?: string })?.full_name
          : (c as { full_name?: string } | null)?.full_name;
        const num = j.job_number != null ? String(j.job_number) : "";
        const title = j.title != null ? String(j.title) : "";
        const label = [num || null, title || null, client_name ? String(client_name) : null].filter(Boolean).join(" · ");
        labelById.set(String(j.id), label || String(j.id).slice(0, 8));
      }
      jobSpend = jt.map((r) => ({
        job_id: r.job_id,
        label: labelById.get(r.job_id) ?? r.job_id.slice(0, 8),
        total_cents: Number(r.total_cents),
        expense_count: Number(r.expense_count),
      }));
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "Could not load expense intelligence.";
  }

  const maxCat = by_category.reduce((m, r) => Math.max(m, Number(r.total_cents)), 0) || 1;
  const maxPay = by_payment.reduce((m, r) => Math.max(m, Number(r.total_cents)), 0) || 1;
  const maxMonth = monthly.reduce((m, r) => Math.max(m, Number(r.total_cents)), 0) || 1;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Expense intelligence</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Operational spend visibility — category mix, payment rails, job costing, and sheet imports with undo.
          </p>
        </div>
        <Link
          href="/admin/expenses/import"
          className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 no-underline shadow-lg shadow-sky-900/25 transition hover:brightness-110"
        >
          Import expenses
        </Link>
      </div>

      {importedBanner ? (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
          Import completed. Totals below now include the new batch (duplicates were skipped automatically).
        </div>
      ) : null}

      {err ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {err}{" "}
          <span className="text-amber-200/80">
            If this is the first run, apply the latest Supabase migration so analytics views exist.
          </span>
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 ring-1 ring-white/[0.06] lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Portfolio spend</p>
          <p className="mt-2 text-4xl font-semibold tabular-nums text-white">{fmtMoney(total_cents)}</p>
          <p className="mt-2 text-sm text-zinc-500">{expense_count} expenses on file</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-transparent p-6 ring-1 ring-sky-400/15">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-200/80">Sheets → PBPP</p>
          <p className="mt-2 text-sm text-sky-50/90">
            Drag CSVs, paste from Google Sheets, preview heuristics, then commit. Identical rows never duplicate.
          </p>
          <Link
            href="/admin/expenses/import"
            className="mt-4 inline-flex rounded-lg border border-sky-400/30 bg-black/30 px-3 py-2 text-xs font-semibold text-sky-100 no-underline transition hover:border-sky-300/50 hover:bg-sky-500/10"
          >
            Open import console →
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
          <h2 className="text-sm font-semibold text-white">Categories</h2>
          <p className="mt-1 text-xs text-zinc-500">Auto-tagged from vendors when your sheet leaves category blank.</p>
          <div className="mt-5 space-y-4">
            {by_category.length ? (
              by_category.map((r) => (
                <div key={r.category}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-zinc-200">{r.category}</span>
                    <span className="tabular-nums text-zinc-400">
                      {fmtMoney(Number(r.total_cents))} · {r.expense_count} tx
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      style={{ width: `${Math.max(6, Math.round((Number(r.total_cents) / maxCat) * 100))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No categorized spend yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
          <h2 className="text-sm font-semibold text-white">Payment rails</h2>
          <p className="mt-1 text-xs text-zinc-500">Card, Zelle, cash, and digital wallets normalized on import.</p>
          <div className="mt-5 space-y-4">
            {by_payment.length ? (
              by_payment.map((r) => (
                <div key={r.payment_method}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-zinc-200">{r.payment_method}</span>
                    <span className="tabular-nums text-zinc-400">
                      {fmtMoney(Number(r.total_cents))} · {r.expense_count} tx
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                      style={{ width: `${Math.max(6, Math.round((Number(r.total_cents) / maxPay) * 100))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No payment mix yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
        <h2 className="text-sm font-semibold text-white">Monthly cadence</h2>
        <p className="mt-1 text-xs text-zinc-500">Rolling operational burn — ideal for seasonal Palm Beach cycles.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {monthly.length ? (
            monthly.map((r) => (
              <div key={r.month_start} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {new Date(`${r.month_start}T12:00:00`).toLocaleString("en-US", { month: "short", year: "numeric" })}
                </p>
                <p className="mt-2 text-lg font-semibold tabular-nums text-white">{fmtMoney(Number(r.total_cents))}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-1.5 rounded-full bg-white/70"
                    style={{ width: `${Math.max(8, Math.round((Number(r.total_cents) / maxMonth) * 100))}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">{r.expense_count} expenses</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">No monthly history yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Job costing</h2>
            <p className="mt-1 text-xs text-zinc-500">Spend matched to jobs from sheet text or related job columns.</p>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-black/30">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3 text-right">Expenses</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-200">
              {jobSpend.length ? (
                jobSpend.map((j) => (
                  <tr key={j.job_id}>
                    <td className="px-4 py-3 text-sm text-white">{j.label}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-400">{j.expense_count}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-white">{fmtMoney(j.total_cents)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/jobs/${j.job_id}`} className="text-xs font-semibold text-sky-300 no-underline hover:underline">
                        View job
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-sm text-zinc-500" colSpan={4}>
                    No job-linked spend yet. Imports try to match job numbers, titles, or client names from your sheet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Import history</h2>
          <p className="mt-1 text-xs text-zinc-500">Every sheet run is auditable. Undo removes only that batch — nothing else is touched.</p>
        </div>
        <ExpenseBatchesPanel batches={batches} />
      </section>
    </div>
  );
}
