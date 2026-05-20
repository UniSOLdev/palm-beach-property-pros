import Link from "next/link";
import { notFound } from "next/navigation";
import { JobDetailView } from "@/components/admin/job-detail-view";
import { getJobDetail } from "@/lib/admin/actions/jobs";
import { listCrewOptions, listTasksForJob } from "@/lib/admin/actions/tasks";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getJobDetail(id);
  return {
    title: data ? `${data.job.service_type} · Job` : "Job not found",
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let data;
  try {
    data = await getJobDetail(id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load job";
    return (
      <div className="admin-card space-y-3">
        <h1 className="text-xl font-bold text-navy">Could not load job</h1>
        <p className="text-sm text-charcoal/70">{message}</p>
        <Link href="/admin/jobs" className="admin-btn inline-flex no-underline">
          Back to jobs
        </Link>
      </div>
    );
  }

  if (!data) notFound();

  const [jobTasks, crew] = await Promise.all([listTasksForJob(id), listCrewOptions()]);

  return <JobDetailView data={data} jobTasks={jobTasks} crew={crew} />;
}
