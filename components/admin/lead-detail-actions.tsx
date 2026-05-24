"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addLeadNote,
  convertLeadToClient,
  convertLeadToInvoice,
  convertLeadToQuote,
  logLeadContact,
  updateLeadStatus,
} from "@/lib/admin/actions/leads";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/admin/lead-constants";

type Props = {
  leadId: string;
  currentStatus: LeadStatus;
  hasClient: boolean;
  hasQuote: boolean;
  hasInvoice: boolean;
  phone: string;
  email: string | null;
};

function phoneTel(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:${digits}` : "#";
}

function phoneSms(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `sms:${digits}` : "#";
}

export function LeadDetailActions({
  leadId,
  currentStatus,
  hasClient,
  hasQuote,
  hasInvoice,
  phone,
  email,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <a href={phoneTel(phone)} className="admin-btn min-h-[48px] no-underline" onClick={() => logLeadContact(leadId, "call")}>
          Call
        </a>
        <a href={phoneSms(phone)} className="admin-btn-secondary min-h-[48px] no-underline" onClick={() => logLeadContact(leadId, "text")}>
          Text
        </a>
        {email ? (
          <a
            href={`mailto:${email}`}
            className="admin-btn-secondary min-h-[48px] no-underline"
            onClick={() => logLeadContact(leadId, "email")}
          >
            Email
          </a>
        ) : null}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">Status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LEAD_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              disabled={pending || status === currentStatus}
              onClick={() => run(() => updateLeadStatus(leadId, status))}
              className={`min-h-[44px] rounded-full px-3 py-2 text-xs font-semibold transition ${
                status === currentStatus
                  ? "bg-navy text-cream"
                  : "border border-navy/15 bg-white text-navy hover:bg-sky/40"
              } disabled:opacity-60`}
            >
              {LEAD_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">Convert</p>
        <div className="flex flex-wrap gap-2">
          {!hasClient ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(async () => { await convertLeadToClient(leadId); })}
              className="admin-btn-secondary min-h-[48px]"
            >
              → Client
            </button>
          ) : null}
          {!hasQuote ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(async () => { await convertLeadToQuote(leadId); })}
              className="admin-btn-secondary min-h-[48px]"
            >
              → Estimate
            </button>
          ) : null}
          {!hasInvoice ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(async () => { await convertLeadToInvoice(leadId); })}
              className="admin-btn min-h-[48px]"
            >
              → Invoice
            </button>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await addLeadNote(leadId, note);
            setNote("");
          });
        }}
        className="space-y-2"
      >
        <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/60">
          Add note
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Follow-up details, scope notes, scheduling…"
          className="w-full rounded-xl border border-navy/15 px-3 py-2.5 text-base"
        />
        <button type="submit" disabled={pending || !note.trim()} className="admin-btn min-h-[48px]">
          Save note
        </button>
      </form>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
