import { notFound } from "next/navigation";
import { ChangeOrderApprovalForm } from "@/components/co/change-order-approval-form";
import { getPublicChangeOrder } from "@/lib/admin/actions/change-orders";
import { formatCurrency, formatDate } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Change Order Approval · Palm Beach Property Pros",
  robots: { index: false, follow: false },
};

export default async function PublicChangeOrderPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const data = await getPublicChangeOrder(publicId);
  if (!data) notFound();

  const { order, items, job } = data;
  const lines = items.map((i) => ({
    description: i.description,
    quantity: Number(i.quantity),
    unit_price: Number(i.unit_price),
    line_total: Number(i.line_total),
  }));

  return (
    <main className="min-h-screen bg-cream px-4 py-8 pb-safe">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-ocean">Palm Beach Property Pros</p>
          <h1 className="mt-2 text-2xl font-bold text-navy">Change Order</h1>
          <p className="text-sm text-charcoal/70">{order.change_order_number}</p>
        </header>

        <section className="rounded-2xl border border-navy/10 bg-white p-4 text-sm space-y-2">
          {order.client_name ? <p><span className="text-charcoal/60">Client:</span> {order.client_name}</p> : null}
          {job ? (
            <p>
              <span className="text-charcoal/60">Project:</span> {job.service_type} — {job.address}
            </p>
          ) : null}
          <p className="font-semibold text-navy">{order.title}</p>
          {order.scope_change_reason ? (
            <div className="pt-2 border-t border-navy/5">
              <p className="text-xs font-bold uppercase text-charcoal/50">Scope change</p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{order.scope_change_reason}</p>
            </div>
          ) : null}
        </section>

        {order.status === "approved" ? (
          <div className="rounded-2xl bg-leaf/20 px-4 py-6 text-center space-y-2">
            <p className="font-bold text-navy">Already approved</p>
            {order.approved_at ? (
              <p className="text-sm text-charcoal/70">{formatDate(order.approved_at)}</p>
            ) : null}
            {order.approval_signature_name ? (
              <p className="text-sm">Signed: {order.approval_signature_name}</p>
            ) : null}
            <p className="text-sm font-semibold">Total: {formatCurrency(Number(order.total))}</p>
          </div>
        ) : order.status === "declined" ? (
          <div className="rounded-2xl bg-sand/80 px-4 py-6 text-center">
            <p className="font-bold text-navy">Declined</p>
            {order.decline_reason ? <p className="mt-2 text-sm">{order.decline_reason}</p> : null}
          </div>
        ) : (
          <ChangeOrderApprovalForm
            publicId={publicId}
            total={Number(order.total)}
            lines={lines}
            alreadyApproved={false}
            alreadyDeclined={false}
          />
        )}

        <p className="text-center text-xs text-charcoal/50">
          Questions? Contact Palm Beach Property Pros.
        </p>
      </div>
    </main>
  );
}
