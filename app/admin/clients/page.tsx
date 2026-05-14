import Link from "next/link";
import { AdminPageHeader, Card, StatusBadge } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/admin/format";
import { adminSeed } from "@/lib/admin/seed";

export default function ClientsPage() {
  const rows = adminSeed.clients.map((c) => {
    const revenue = adminSeed.jobs.filter((j) => j.clientId === c.id).reduce((acc, j) => acc + j.revenue, 0);
    const jobsDone = adminSeed.jobs.filter(
      (j) => j.clientId === c.id && ["Completed", "Paid"].includes(j.status),
    ).length;
    return { c, revenue, jobsDone };
  });

  return (
    <div>
      <AdminPageHeader
        title="Clients"
        subtitle="CRM-style records with revenue, jobs, and follow-up context."
        actions={
          <Link href="/admin/clients/new" className="btn-primary no-underline">
            New client
          </Link>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-charcoal/55">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4 text-right">Revenue</th>
                <th className="py-2 pr-4 text-right">Jobs</th>
                <th className="py-2 pr-4">Review</th>
                <th className="py-2 pr-0 text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, revenue, jobsDone }) => (
                <tr key={c.id} className="border-b border-navy/5 last:border-0">
                  <td className="py-3 pr-4 font-semibold text-navy">{c.name}</td>
                  <td className="py-3 pr-4 text-charcoal/80">{c.clientType}</td>
                  <td className="py-3 pr-4 text-charcoal/80">{c.phone}</td>
                  <td className="py-3 pr-4 text-right font-semibold text-navy">{formatCurrency(revenue)}</td>
                  <td className="py-3 pr-4 text-right">{jobsDone}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={c.reviewStatus} />
                  </td>
                  <td className="py-3 pr-0 text-right">
                    <Link href={`/admin/clients/${c.id}`} className="font-semibold text-ocean no-underline">
                      Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
