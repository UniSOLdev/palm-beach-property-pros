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
import { copyQuotePublicLink, markQuoteSent } from "@/lib/admin/actions/quotes";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/admin/lead-constants";
import {
  QUOTE_APPROVAL_LABELS,
  quoteApprovalClass,
  type QuoteApprovalStatus,
} from "@/lib/quotes/constants";

type Props = {
  leadId: string;
  currentStatus: LeadStatus;
  hasClient: boolean;
  hasQuote: boolean;
  hasInvoice: boolean;
  quotePublicUrl: string | null;
  quoteId: string | null;
  quoteApprovalStatus: string | null;
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
  quotePublicUrl,
  quoteId,
  quoteApprovalStatus,
  phone,
  email,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function run(action: () => Promise<void>) {
    setError(null);
    setSuccess(null);
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
        <a
          href={phoneTel(phone)}
          className="admin-btn min-h-[48px] no-underline"
          onClick={() => logLeadContact(leadId, "call")}
        >
          Call
        </a>
        <a
          href={phoneSms(phone)}
          className="admin-btn-secondary min-h-[48px] no-underline"
          onClick={() => logLeadContact(leadId, "text")}
        >
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

      {quotePublicUrl ? (
        <div className="rounded-xl bg-sky/40 px-4 py-3 text-sm space-y-2">
          <p>
            Public quote:{" "}
            <a href={quotePublicUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-ocean break-all">
              {quotePublicUrl}
            </a>
          </p>
          {quoteApprovalStatus ? (
            <p>
              Approval:{" "}
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${quoteApprovalClass(quoteApprovalStatus as QuoteApprovalStatus)}`}
              >
                {QUOTE_APPROVAL_LABELS[quoteApprovalStatus as QuoteApprovalStatus] ?? quoteApprovalStatus}
              </span>
            </p>
          ) : null}
          {quoteId ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={pending}
                className="admin-btn min-h-[44px] px-3 text-xs"
                onClick={() =>
                  run(async () => {
                    const result = await markQuoteSent(quoteId);
                    if (result.smsHref) window.open(result.smsHref, "_blank");
                    else if (result.mailtoHref) window.location.href = result.mailtoHref;
                    setSuccess("Quote marked sent.");
                  })
                }
              >
                Send Quote
              </button>
              <button
                type="button"
                disabled={pending}
                className="admin-btn-secondary min-h-[44px] px-3 text-xs"
                onClick={() =>
                  run(async () => {
                    const link = await copyQuotePublicLink(quoteId);
                    await navigator.clipboard.writeText(link);
                    setSuccess("Public link copied.");
                  })
                }
              >
                Copy Link
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

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
              onClick={() =>
                run(async () => {
                  await convertLeadToClient(leadId);
                  setSuccess("Client record created.");
                })
              }
              className="admin-btn-secondary min-h-[48px]"
            >
              → Client
            </button>
          ) : null}
          {!hasQuote ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const result = await convertLeadToQuote(leadId);
                  setSuccess(`Quote created. Share link: ${result.publicUrl}`);
                })
              }
              className="admin-btn-secondary min-h-[48px]"
            >
              → Estimate
            </button>
          ) : null}
          {!hasInvoice ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const result = await convertLeadToInvoice(leadId);
                  router.push(`/admin/invoices/${result.invoiceId}`);
                })
              }
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
            setSuccess("Note saved.");
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

      {success ? <p className="rounded-xl bg-leaf/15 px-4 py-3 text-sm text-navy">{success}</p> : null}
      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
