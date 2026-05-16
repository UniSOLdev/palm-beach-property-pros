export const dynamic = "force-dynamic";

import { TaskForm } from "@/components/admin/task-form";

export const metadata = { title: "New task" };

export default async function AdminNewTaskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  return (
    <TaskForm
      mode="create"
      defaults={{
        client_id: str(sp.client_id),
        job_id: str(sp.job_id),
        quote_id: str(sp.quote_id),
        invoice_id: str(sp.invoice_id),
      }}
    />
  );
}
