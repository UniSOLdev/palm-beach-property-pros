import Link from "next/link";
import { notFound } from "next/navigation";
import { JobEditForm } from "@/components/admin/job-edit-form";
import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import { getJobDetail } from "@/lib/admin/actions/jobs";
import { listCrewOptions } from "@/lib/admin/actions/tasks";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Job" };

export default async function JobEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, crew] = await Promise.all([getJobDetail(id), listCrewOptions()]);
  if (!data) notFound();

  return (
    <div className="space-y-4 pb-24">
      <div>
        <Link href={`/admin/jobs/${id}`} className="text-sm font-semibold text-ocean no-underline">
          ← Back to job
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy">Edit job</h1>
        <p className="text-sm text-charcoal/70">{data.job.service_type}</p>
        <div className="mt-3">
          <TaskQuickAdd
            crew={crew}
            variant="secondary"
            label="+ Add job task"
            defaults={{
              job_id: data.job.id,
              client_id: data.job.client_id,
              category: "Job Follow-Up",
            }}
          />
        </div>
      </div>
      <JobEditForm job={data.job} />
    </div>
  );
}
