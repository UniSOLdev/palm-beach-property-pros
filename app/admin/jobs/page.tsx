export const dynamic = "force-dynamic";

import Link from "next/link";
import { CreateJobButton } from "@/components/admin/create-job-button";
import { mapJobListItem } from "@/lib/job-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata = {
  title: "Jobs",
};

function fmtMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function AdminJobsPage() {
  let rows: ReturnType<typeof mapJobListItem>[] = [];
  let err: string | null = null;

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        id,
        job_number,
        title,
        status,
        client_id,
        revenue_cents,
        service_type,
        created_at,
        updated_at,
        clients ( full_name )
      `,
      )
      .order("updated_at", { ascending: false })
      .limit(120);

    if (error) throw error;

    rows = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const c = r.clients;
      const name = Array.isArray(c)
        ? (c[0] as { full_name?: string })?.full_name
        : (c as { full_name?: string })?.full_name;
      return mapJobListItem(r, name ? String(name) : null);
    });
  } catch (e) {
    err = e instanceof Error ? e.message : "Could not load jobs.";
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Jobs</h1>
          <p className="mt-1 text-sm text-zinc-500">Operational records — editable, relationally synced.</p>
        </div>
        <CreateJobButton />
      </div>

      {err ? (
        <p className="mt-6 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {err}
        </p>
      ) : null}

      <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] ring-1 ring-white/[0.05]">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((j) => (
              <tr key={j.id} className="transition hover:bg-white/[0.04]">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/jobs/${j.id}`}
                    className="font-medium text-sky-200 no-underline hover:underline"
                  >
                    {j.job_number ?? j.id.slice(0, 8)}
                  </Link>
                  <div className="text-xs text-zinc-500">{j.title}</div>
                </td>
                <td className="px-4 py-3 text-zinc-300">{j.client_name ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-400">{j.service_type ?? "—"}</td>
                <td className="px-4 py-3 capitalize text-zinc-400">{j.status.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-200">{fmtMoney(j.revenue_cents)}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {j.updated_at ? new Date(j.updated_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !err ? (
          <p className="px-4 py-10 text-center text-sm text-zinc-500">No jobs yet. Create one to begin.</p>
        ) : null}
      </div>
    </div>
  );
}
