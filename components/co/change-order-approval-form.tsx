"use client";

import { useState, useTransition } from "react";
import { submitChangeOrderApprovalAction } from "@/lib/admin/actions/change-orders";
import { APPROVAL_LEGAL_TEXT } from "@/lib/admin/change-order-constants";
import { formatCurrency } from "@/lib/admin/format";

type Line = { description: string; quantity: number; unit_price: number; line_total: number };

export function ChangeOrderApprovalForm({
  publicId,
  total,
  lines,
  alreadyApproved,
  alreadyDeclined,
}: {
  publicId: string;
  total: number;
  lines: Line[];
  alreadyApproved: boolean;
  alreadyDeclined: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [signature, setSignature] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [done, setDone] = useState<"approved" | "declined" | null>(
    alreadyApproved ? "approved" : alreadyDeclined ? "declined" : null,
  );
  const [error, setError] = useState("");

  if (done === "approved") {
    return (
      <div className="rounded-2xl bg-leaf/20 px-6 py-8 text-center">
        <p className="text-xl font-bold text-navy">Thank you — approved</p>
        <p className="mt-2 text-sm text-charcoal/80">
          Palm Beach Property Pros has your authorization to proceed with this change order.
        </p>
        <p className="mt-4 text-sm font-semibold text-navy">Approved total: {formatCurrency(total)}</p>
      </div>
    );
  }

  if (done === "declined") {
    return (
      <div className="rounded-2xl bg-sand/80 px-6 py-8 text-center">
        <p className="text-xl font-bold text-navy">Response recorded</p>
        <p className="mt-2 text-sm text-charcoal/80">
          We received your response. Our team will follow up before proceeding with additional work.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-3 rounded-2xl border border-navy/10 bg-white p-4">
        {lines.map((line, i) => (
          <li key={i} className="flex justify-between gap-3 text-sm border-b border-navy/5 pb-2 last:border-0">
            <span className="text-charcoal/90">{line.description}</span>
            <span className="font-semibold text-navy shrink-0">{formatCurrency(Number(line.line_total))}</span>
          </li>
        ))}
        <li className="flex justify-between pt-2 text-lg font-bold text-navy">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </li>
      </ul>

      <p className="text-sm leading-relaxed text-charcoal/85">{APPROVAL_LEGAL_TEXT}</p>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <label className="block text-sm font-semibold text-navy">
        Type your full name (electronic signature)
        <input
          className="mt-2 w-full min-h-[52px] rounded-xl border border-navy/20 px-4 text-base"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Legal full name"
          autoComplete="name"
        />
      </label>

      <button
        type="button"
        disabled={pending || signature.trim().length < 2}
        className="w-full min-h-[56px] rounded-xl bg-navy text-base font-bold text-white disabled:opacity-50"
        onClick={() =>
          startTransition(async () => {
            setError("");
            try {
              await submitChangeOrderApprovalAction(publicId, "approve", signature.trim());
              setDone("approved");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not submit approval");
            }
          })
        }
      >
        I approve this change order
      </button>

      <details className="rounded-xl border border-navy/10 bg-white/60 px-4 py-3">
        <summary className="min-h-[44px] cursor-pointer text-sm font-semibold text-charcoal/80">
          Decline or request changes
        </summary>
        <div className="mt-3 space-y-3">
          <textarea
            className="w-full rounded-xl border border-navy/20 p-3 text-sm"
            rows={3}
            placeholder="Optional message…"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
          <button
            type="button"
            disabled={pending}
            className="w-full min-h-[48px] rounded-xl border-2 border-navy/20 text-sm font-semibold text-navy"
            onClick={() =>
              startTransition(async () => {
                setError("");
                try {
                  await submitChangeOrderApprovalAction(publicId, "decline", undefined, declineReason);
                  setDone("declined");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not submit");
                }
              })
            }
          >
            Decline / request changes
          </button>
        </div>
      </details>
    </div>
  );
}
