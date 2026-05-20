"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addApprovedChangeOrderToInvoice,
  markChangeOrderSent,
} from "@/lib/admin/actions/change-orders";
import { createTasksBulk } from "@/lib/admin/actions/tasks";
import {
  CHANGE_ORDER_WORKFLOW_SHORTCUTS,
  changeOrderStatusClass,
} from "@/lib/admin/change-order-constants";
import { changeOrderPublicUrl } from "@/lib/admin/change-order-utils";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import type { ChangeOrderRow } from "@/lib/admin/types-change-orders";

export function ChangeOrderJobPanel({
  jobId,
  clientId,
  invoiceId,
  orders,
}: {
  jobId: string;
  clientId: string;
  invoiceId: string | null;
  orders: ChangeOrderRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  async function copyLink(publicId: string) {
    const url = changeOrderPublicUrl(publicId);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(publicId);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("");
      window.prompt("Copy approval link:", url);
    }
  }

  return (
    <section className="admin-card space-y-4" id="change-orders">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-navy">Change orders</h2>
          <p className="text-xs text-charcoal/60">Scope changes with client approval</p>
        </div>
        <Link
          href={`/admin/change-orders/new?jobId=${jobId}`}
          className="admin-btn min-h-[48px] px-4 text-xs no-underline"
        >
          + Create
        </Link>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <details className="rounded-xl border border-navy/10 bg-cream/40 px-3 py-2">
        <summary className="min-h-[44px] cursor-pointer text-sm font-semibold text-navy">Workflow shortcuts</summary>
        <ul className="mt-2 space-y-2">
          {Object.values(CHANGE_ORDER_WORKFLOW_SHORTCUTS).map((item) => (
            <li key={item.title}>
              <button
                type="button"
                className="w-full rounded-lg bg-white px-3 py-2 text-left text-xs font-medium text-navy ring-1 ring-navy/10 min-h-[44px]"
                onClick={() =>
                  startTransition(async () => {
                    await createTasksBulk([item], { job_id: jobId, client_id: clientId, category: item.category });
                    router.refresh();
                  })
                }
              >
                + {item.title}
              </button>
            </li>
          ))}
        </ul>
      </details>

      {orders.length === 0 ? (
        <p className="text-sm text-charcoal/60">No change orders yet.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((co) => (
            <li key={co.id} className="rounded-xl border border-navy/10 bg-white p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/admin/change-orders/${co.id}`} className="font-semibold text-navy no-underline">
                  {co.change_order_number}
                </Link>
                <span className={`admin-chip text-xs ${changeOrderStatusClass(co.status)}`}>{co.status}</span>
              </div>
              <p className="text-sm text-charcoal/80">{co.title}</p>
              <p className="text-sm font-bold text-navy">{formatCurrency(Number(co.total))}</p>
              {co.approved_at ? (
                <p className="text-xs text-charcoal/60">Approved {formatDate(co.approved_at)}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {(co.status === "draft" || co.status === "sent") && (
                  <button
                    type="button"
                    disabled={pending}
                    className="admin-btn-secondary min-h-[44px] px-3 text-xs"
                    onClick={() =>
                      startTransition(async () => {
                        setError("");
                        try {
                          if (co.status === "draft") await markChangeOrderSent(co.id);
                          await copyLink(co.public_id);
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Failed");
                        }
                      })
                    }
                  >
                    {copied === co.public_id ? "Copied!" : "Copy approval link"}
                  </button>
                )}
                {co.status === "approved" && !co.invoice_id ? (
                  <button
                    type="button"
                    disabled={pending || !invoiceId}
                    title={!invoiceId ? "Create a job invoice first" : undefined}
                    className="admin-btn min-h-[44px] px-3 text-xs disabled:opacity-50"
                    onClick={() =>
                      startTransition(async () => {
                        setError("");
                        try {
                          const invId = await addApprovedChangeOrderToInvoice(co.id, invoiceId ?? undefined);
                          router.push(`/admin/invoices/${invId}`);
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Could not add to invoice");
                        }
                      })
                    }
                  >
                    Add to invoice
                  </button>
                ) : null}
                {co.invoice_id ? (
                  <Link href={`/admin/invoices/${co.invoice_id}`} className="admin-btn-secondary min-h-[44px] px-3 text-xs no-underline">
                    View invoice
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
