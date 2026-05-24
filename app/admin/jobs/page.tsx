import Link from "next/link";
import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { getCrewPayoutTotalsByJob } from "@/lib/admin/crew-payout-totals";
import { calculateJobProfit } from "@/lib/admin/job-costing";
import { fromSupabase } from "@/lib/admin/db-query";
import { formatCurrency, formatDate, formatPercent } from "@/lib/admin/format";
import { listCrewOptions } from "@/lib/admin/actions/tasks";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jobs" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminJobsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const search = q?.trim().toLowerCase() ?? "";

  let crew: Awaited<ReturnType<typeof listCrewOptions>> = [];
  try {
    crew = await listCrewOptions();
  } catch {
    /* non-blocking */
  }

  const supabase = await createClient();
  const [jobsResult, crewPayoutMap] = await Promise.all([
    supabase
      .from("jobs")
      .select("*, clients(name)")
      .eq("archived", false)
      .order("job_date", { ascending: false }),
    getCrewPayoutTotalsByJob(supabase),
  ]);

  const query = fromSupabase(jobsResult.data, jobsResult.error, {
    route: "/admin/jobs",
    query: "jobs with clients",
  });

  if (!query.ok) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Jobs" subtitle="Profitability and field documentation" />
        <LoadError title="Could not load jobs" message={query.error} retryHref="/admin/jobs" />
      </div>
    );
  }

  const jobs = (query.data ?? []).filter((job) => {
    if (!search) return true;
    const clientName =
      job.clients && typeof job.clients === "object" && "name" in job.clients
        ? String((job.clients as { name: string }).name).toLowerCase()
        : "";
    return (
      job.service_type.toLowerCase().includes(search) ||
      job.address.toLowerCase().includes(search) ||
      job.status.toLowerCase().includes(search) ||
      clientName.includes(search)
    );
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Jobs"
        subtitle="Profitability and field documentation"
        actionHref="/admin/tasks"
        actionLabel="All tasks"
      />
      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search jobs, client, address…"
          className="min-h-[48px] flex-1 rounded-xl border border-navy/15 px-4 text-base"
        />
        <button type="submit" className="admin-btn min-h-[48px] px-4">
          Search
        </button>
      </form>
      <TaskQuickAdd crew={crew} variant="primary" label="+ Add job task" className="w-full" />
      <ul className="space-y-3">
        {!jobs.length ? (
          <EmptyState>
            {search ? "No jobs match your search." : "No jobs yet. Create one from a quote or add manually in Supabase."}
          </EmptyState>
        ) : (
          jobs.map((job) => {
            const profit = calculateJobProfit({
              revenue: Number(job.revenue),
              job_expense_total: Number(job.job_expense_total),
              estimated_labor_cost: Number(job.estimated_labor_cost ?? 0),
              estimated_materials_cost: Number(job.estimated_materials_cost ?? 0),
              fuel_cost: Number(job.fuel_cost ?? 0),
              dump_fee_cost: Number(job.dump_fee_cost ?? 0),
              truck_rental_cost: Number(job.truck_rental_cost ?? 0),
              equipment_cost: Number(job.equipment_cost ?? 0),
              crew_payout_total: crewPayoutMap[job.id] ?? 0,
            });
            const clientName =
              job.clients && typeof job.clients === "object" && "name" in job.clients
                ? String((job.clients as { name: string }).name)
                : "Client";
            return (
              <li key={job.id} className="admin-card min-h-[88px]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy">{job.service_type}</p>
                    <p className="text-xs text-charcoal/60">
                      {clientName} · {formatDate(job.job_date)} · {job.status}
                    </p>
                  </div>
                  <span className="admin-chip bg-sky/50 text-navy">{formatPercent(profit.margin)}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <p>
                    Revenue <span className="font-semibold">{formatCurrency(Number(job.revenue))}</span>
                  </p>
                  <p>
                    Profit <span className="font-semibold">{formatCurrency(profit.actualProfit)}</span>
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/admin/jobs/${job.id}`}
                    className="inline-flex min-h-[48px] items-center text-sm font-semibold text-ocean no-underline"
                  >
                    Job details →
                  </Link>
                  <TaskQuickAdd
                    crew={crew}
                    variant="compact"
                    label="+ Task"
                    defaults={{
                      job_id: job.id,
                      client_id: job.client_id,
                      category: "Job Follow-Up",
                    }}
                  />
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
