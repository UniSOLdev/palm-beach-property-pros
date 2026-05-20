"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addApprovedChangeOrderToInvoice,
  markChangeOrderSent,
  voidChangeOrder,
} from "@/lib/admin/actions/change-orders";
import { changeOrderPublicUrl } from "@/lib/admin/change-order-utils";
import { changeOrderStatusClass } from "@/lib/admin/change-order-constants";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import type { ChangeOrderItemRow, ChangeOrderRow } from "@/lib/admin/types-change-orders";

export function ChangeOrderDetailActions({
  order,
  items,
  jobId,
  jobLabel,
  invoiceId,
}: {
  order: ChangeOrderRow;
  items: ChangeOrderItemRow[];
  jobId: string;
  jobLabel: string | null;
  invoiceId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const publicUrl = changeOrderPublicUrl(order.public_id);

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href="/admin/change-orders" className="text-sm font-semibold text-ocean no-underline">
            ← Change orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-navy">{order.change_order_number}</h1>
          <p className="text-sm text-charcoal/70">{order.title}</p>
        </div>
        <span className={`admin-chip ${changeOrderStatusClass(order.status)}`}>{order.status}</span>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="admin-card space-y-2 text-sm">
        {jobLabel ? (
          <p>
            Job:{" "}
            <Link href={`/admin/jobs/${jobId}`} className="font-semibold text-ocean no-underline">
              {jobLabel}
            </Link>
          </p>
        ) : null}
        {order.client_name ? <p>Client: {order.client_name}</p> : null}
        {order.scope_change_reason ? (
          <div>
            <p className="font-semibold text-navy">Scope change</p>
            <p className="whitespace-pre-wrap text-charcoal/85">{order.scope_change_reason}</p>
          </div>
        ) : null}
        {order.sent_at ? <p className="text-charcoal/60">Sent {formatDate(order.sent_at)}</p> : null}
        {order.approved_at ? (
          <p className="text-charcoal/60">
            Approved {formatDate(order.approved_at)}
            {order.approval_signature_name ? ` · ${order.approval_signature_name}` : ""}
          </p>
        ) : null}
      </div>

      <ul className="admin-card space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-2 text-sm border-b border-navy/5 pb-2 last:border-0">
            <span>{item.description}</span>
            <span className="font-semibold text-navy shrink-0">
              {formatCurrency(Number(item.line_total))}
            </span>
          </li>
        ))}
        <li className="flex justify-between text-lg font-bold text-navy pt-2">
          <span>Total</span>
          <span>{formatCurrency(Number(order.total))}</span>
        </li>
      </ul>

      <div className="flex flex-wrap gap-2">
        {order.status === "draft" ? (
          <Link href={`/admin/change-orders/${order.id}/edit`} className="admin-btn-secondary min-h-[48px] no-underline">
            Edit draft
          </Link>
        ) : null}
        {(order.status === "draft" || order.status === "sent") && (
          <>
            <button
              type="button"
              disabled={pending}
              className="admin-btn min-h-[48px]"
              onClick={() =>
                startTransition(async () => {
                  setError("");
                  try {
                    if (order.status === "draft") await markChangeOrderSent(order.id);
                    await navigator.clipboard.writeText(publicUrl);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Failed");
                  }
                })
              }
            >
              Copy approval link
            </button>
            <Link href={publicUrl} target="_blank" className="admin-btn-secondary min-h-[48px] no-underline">
              Preview
            </Link>
          </>
        )}
        {order.status === "approved" && !order.invoice_id ? (
          <button
            type="button"
            disabled={pending || !invoiceId}
            className="admin-btn min-h-[48px] disabled:opacity-50"
            title={!invoiceId ? "Link a job invoice first" : undefined}
            onClick={() =>
              startTransition(async () => {
                setError("");
                try {
                  const inv = await addApprovedChangeOrderToInvoice(order.id, invoiceId ?? undefined);
                  router.push(`/admin/invoices/${inv}`);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed");
                }
              })
            }
          >
            Add to invoice
          </button>
        ) : null}
        {order.invoice_id ? (
          <Link href={`/admin/invoices/${order.invoice_id}`} className="admin-btn-secondary min-h-[48px] no-underline">
            View invoice
          </Link>
        ) : null}
        {order.status !== "void" && order.status !== "approved" ? (
          <button
            type="button"
            disabled={pending}
            className="admin-btn-secondary min-h-[48px] text-red-700"
            onClick={() =>
              startTransition(async () => {
                if (!confirm("Void this change order?")) return;
                await voidChangeOrder(order.id);
                router.refresh();
              })
            }
          >
            Void
          </button>
        ) : null}
      </div>
    </div>
  );
}
