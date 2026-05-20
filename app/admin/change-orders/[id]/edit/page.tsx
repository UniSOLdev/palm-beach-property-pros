import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { ChangeOrderBuilder } from "@/components/admin/change-order-builder";
import { getChangeOrderDetail } from "@/lib/admin/actions/change-orders";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Change Order" };

export default async function EditChangeOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getChangeOrderDetail(id);
  if (!detail) notFound();
  if (detail.order.status !== "draft") redirect(`/admin/change-orders/${id}`);

  const supabase = await createClient();
  const [{ data: clients }, { data: jobs }] = await Promise.all([
    supabase.from("clients").select("id, name").eq("archived", false).order("name"),
    supabase
      .from("jobs")
      .select("id, service_type, address, client_id")
      .eq("archived", false)
      .order("job_date", { ascending: false })
      .limit(200),
  ]);

  const prefill = {
    job_id: detail.order.job_id,
    client_id: detail.order.client_id,
    title: detail.order.title,
    scope_change_reason: detail.order.scope_change_reason ?? "",
    notes: detail.order.notes ?? "",
    client_name: detail.order.client_name ?? "",
    client_email: detail.order.client_email ?? "",
    client_phone: detail.order.client_phone ?? "",
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Edit change order" subtitle={detail.order.change_order_number} />
      <ChangeOrderBuilder
        clients={clients ?? []}
        jobs={(jobs ?? []).map((j) => ({
          id: j.id,
          client_id: j.client_id,
          label: `${j.service_type} · ${j.address}`,
        }))}
        prefill={prefill}
        existingId={id}
        initialLines={detail.items.map((i) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
        }))}
        initialTaxRate={Number(detail.order.tax_rate)}
      />
    </div>
  );
}
