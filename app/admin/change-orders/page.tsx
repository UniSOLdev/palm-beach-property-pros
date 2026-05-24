import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { listChangeOrders } from "@/lib/admin/actions/change-orders";
import { changeOrderStatusClass } from "@/lib/admin/change-order-constants";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { logAdminError } from "@/lib/admin/logger";

export const dynamic = "force-dynamic";
export const metadata = { title: "Change Orders" };

export default async function ChangeOrdersPage() {
  let orders: Awaited<ReturnType<typeof listChangeOrders>> = [];
  let loadError = "";

  try {
    orders = await listChangeOrders();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load change orders";
    logAdminError("change orders list failed", e, { route: "/admin/change-orders" });
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Change orders" subtitle="Scope changes with client approval" />
        <LoadError title="Could not load change orders" message={loadError} retryHref="/admin/change-orders" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Change orders"
        subtitle="Scope changes with client approval"
        actionHref="/admin/change-orders/new"
        actionLabel="New change order"
      />
      {orders.length === 0 ? (
        <div className="admin-card">
          <p className="text-sm text-charcoal/70">No change orders yet.</p>
          <Link href="/admin/change-orders/new" className="admin-btn mt-3 inline-flex no-underline">
            Create from job
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((co) => (
            <li key={co.id}>
              <Link
                href={`/admin/change-orders/${co.id}`}
                className="admin-card block no-underline space-y-1 min-h-[64px]"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-navy">{co.change_order_number}</span>
                  <span className={`admin-chip text-xs ${changeOrderStatusClass(co.status)}`}>{co.status}</span>
                </div>
                <p className="text-sm text-charcoal/80">{co.title}</p>
                <p className="text-sm font-semibold text-navy">{formatCurrency(Number(co.total))}</p>
                <p className="text-xs text-charcoal/50">{formatDate(co.created_at)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
