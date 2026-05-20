import { notFound } from "next/navigation";
import { ChangeOrderDetailActions } from "@/components/admin/change-order-detail-actions";
import { getChangeOrderDetail } from "@/lib/admin/actions/change-orders";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getChangeOrderDetail(id);
  return { title: detail ? `${detail.order.change_order_number} · Change Order` : "Change Order" };
}

export default async function ChangeOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getChangeOrderDetail(id);
  if (!detail) notFound();

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("invoice_id")
    .eq("id", detail.order.job_id)
    .maybeSingle();

  return (
    <ChangeOrderDetailActions
      order={detail.order}
      items={detail.items}
      jobId={detail.order.job_id}
      jobLabel={detail.jobLabel}
      invoiceId={job?.invoice_id ?? null}
    />
  );
}
