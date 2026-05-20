import { AdminPageHeader } from "@/components/admin/entity-list";
import { ChangeOrderBuilder } from "@/components/admin/change-order-builder";
import { getChangeOrderPrefillFromJob } from "@/lib/admin/actions/change-orders";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Change Order" };

export default async function NewChangeOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;
  const supabase = await createClient();

  const [{ data: clients }, { data: jobs }] = await Promise.all([
    supabase.from("clients").select("id, name").eq("archived", false).order("name"),
    supabase
      .from("jobs")
      .select("id, service_type, address, client_id, clients(name)")
      .eq("archived", false)
      .order("job_date", { ascending: false })
      .limit(200),
  ]);

  const jobOptions = (jobs ?? []).map((j) => ({
    id: j.id,
    client_id: j.client_id,
    label: `${j.service_type} · ${j.address}`,
  }));

  const prefill = jobId ? await getChangeOrderPrefillFromJob(jobId) : undefined;

  return (
    <div className="space-y-4">
      <AdminPageHeader title="New change order" subtitle="Document scope change before extra work" />
      <ChangeOrderBuilder
        clients={clients ?? []}
        jobs={jobOptions}
        prefill={prefill}
      />
    </div>
  );
}
