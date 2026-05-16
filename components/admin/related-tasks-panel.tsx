import Link from "next/link";
import { TaskCard } from "@/components/admin/task-card";
import { listTasksForRelation } from "@/lib/tasks/queries";

type Props = {
  client_id?: string;
  job_id?: string;
  quote_id?: string;
  invoice_id?: string;
};

export async function RelatedTasksPanel({ client_id, job_id, quote_id, invoice_id }: Props) {
  const tasks = await listTasksForRelation({ client_id, job_id, quote_id, invoice_id });
  if (tasks.length === 0) return null;

  const qs = new URLSearchParams();
  if (client_id) qs.set("client_id", client_id);
  if (job_id) qs.set("job_id", job_id);
  if (quote_id) qs.set("quote_id", quote_id);
  if (invoice_id) qs.set("invoice_id", invoice_id);

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Related tasks</h2>
        <Link href={`/admin/tasks/new?${qs}`} className="text-xs font-semibold text-sky-300 no-underline hover:underline">
          + Add task
        </Link>
      </div>
      <ul className="mt-4 space-y-3">
        {tasks.map((t) => (
          <li key={t.id}>
            <TaskCard task={t} compact />
          </li>
        ))}
      </ul>
    </section>
  );
}
