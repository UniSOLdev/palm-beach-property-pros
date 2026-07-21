import { AdminPageHeader } from "@/components/admin/entity-list";
import { JobScheduler } from "@/components/admin/job-scheduler";
import { listScheduledJobs } from "@/lib/admin/actions/scheduling";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const today = new Date().toISOString().slice(0, 10);
  const end = new Date();
  end.setDate(end.getDate() + 30);
  const jobs = await listScheduledJobs({ from: today, to: end.toISOString().slice(0, 10) });

  return (
    <div className="space-y-4 pb-8">
      <AdminPageHeader title="Schedule" subtitle="Drag jobs between days · tap Navigate for Maps" />
      <JobScheduler jobs={jobs} initialDate={today} />
    </div>
  );
}
