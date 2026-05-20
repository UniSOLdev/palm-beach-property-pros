import Link from "next/link";
import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { calculateJobProfit } from "@/lib/admin/job-costing";
import { formatCurrency, formatDate, formatPercent } from "@/lib/admin/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jobs" };

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, clients(name)")
    .eq("archived", false)
    .order("job_date", { ascending: false });

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Jobs" subtitle="Profitability and field documentation" />
      <ul className="space-y-3">
        {!jobs?.length ? (
          <EmptyState>No jobs yet. Create one from a quote or add manually in Supabase.</EmptyState>
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
            });
            const clientName =
              job.clients && typeof job.clients === "object" && "name" in job.clients
                ? String((job.clients as { name: string }).name)
                : "Client";
            return (
              <li key={job.id} className="admin-card">
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
                <Link href={`/admin/jobs/${job.id}`} className="mt-3 inline-block text-sm font-semibold text-ocean no-underline">
                  Job details →
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
