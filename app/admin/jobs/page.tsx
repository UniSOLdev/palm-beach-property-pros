import Link from "next/link";
import { AdminPageHeader, Card, StatusBadge } from "@/components/admin/ui";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { listClients, listJobs } from "@/lib/admin/queries";

export default async function JobsPage() {
  const [jobs, clients] = await Promise.all([listJobs(), listClients()]);
  const rows = [...jobs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <AdminPageHeader
        title="Jobs"
        subtitle="Schedule, crew, photos, and profitability in one place."
        actions={
          <Link href="/admin/jobs/new" className="btn-primary no-underline">
            New job
          </Link>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-charcoal/55">
                <th className="py-2 pr-4">Job ID</th>
                <th className="py-2 pr-4">Client</th>
                <th className="py-2 pr-4">Service</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-right">Revenue</th>
                <th className="py-2 pr-0 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => {
                const c = clients.find((x) => x.id === j.clientId);
                return (
                  <tr key={j.id} className="border-b border-navy/5 last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs text-charcoal/70">{j.id}</td>
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-navy">{c?.name}</div>
                      <div className="text-xs text-charcoal/55">{c?.phone}</div>
                    </td>
                    <td className="py-3 pr-4 text-charcoal/80">{j.serviceType}</td>
                    <td className="py-3 pr-4 whitespace-nowrap text-charcoal/80">
                      {formatDate(j.date)} {j.startTime}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={j.status} />
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold text-navy">
                      {j.revenue ? formatCurrency(j.revenue) : "—"}
                    </td>
                    <td className="py-3 pr-0 text-right">
                      <Link href={`/admin/jobs/${j.id}`} className="font-semibold text-ocean no-underline">
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
