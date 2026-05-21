export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { JobWorkspace } from "@/components/admin/job-workspace";
import { fetchRecentClientsForCombobox } from "@/lib/admin-recent-clients";
import { fetchClientSummaryById } from "@/lib/client-queries";
import { fetchJobDetailForAdmin } from "@/lib/job-queries";

export const metadata = {
  title: "Job",
};

export default async function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await fetchJobDetailForAdmin(id);
  if (!job) notFound();

  let recentClients = await fetchRecentClientsForCombobox().catch(() => []);
  if (job.client_id && !recentClients.some((c) => c.id === job.client_id)) {
    const c = await fetchClientSummaryById(job.client_id);
    if (c) recentClients = [c, ...recentClients];
  }

  return <JobWorkspace jobId={id} initialJob={job} recentClients={recentClients} />;
}
