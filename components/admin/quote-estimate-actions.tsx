"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  convertQuoteToJob,
  generateQuotePdfDownload,
} from "@/lib/admin/actions/quote-estimates";
import { markQuoteSent } from "@/lib/admin/actions/quotes";

export function QuoteEstimateActions({
  quoteId,
  leadId,
  approvalStatus,
}: {
  quoteId: string;
  leadId: string | null;
  approvalStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div className="admin-card flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        className="admin-btn min-h-[48px] px-3 text-xs"
        onClick={() =>
          startTransition(async () => {
            const result = await markQuoteSent(quoteId);
            if (result.smsHref) window.open(result.smsHref, "_blank");
            else if (result.mailtoHref) window.location.href = result.mailtoHref;
            setMessage("Estimate sent.");
            router.refresh();
          })
        }
      >
        Send estimate
      </button>
      <button
        type="button"
        disabled={pending}
        className="admin-btn-secondary min-h-[48px] px-3 text-xs"
        onClick={() =>
          startTransition(async () => {
            const { base64, filename } = await generateQuotePdfDownload(quoteId);
            const blob = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
            const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
          })
        }
      >
        Download PDF
      </button>
      {(approvalStatus === "signed" || approvalStatus === "viewed") && (
        <button
          type="button"
          disabled={pending}
          className="admin-btn-secondary min-h-[48px] px-3 text-xs"
          onClick={() =>
            startTransition(async () => {
              const { jobId } = await convertQuoteToJob(quoteId);
              router.push(`/admin/jobs/${jobId}/field`);
            })
          }
        >
          Schedule job
        </button>
      )}
      {leadId ? (
        <Link href={`/admin/leads/${leadId}`} className="admin-btn-secondary min-h-[48px] px-3 text-xs no-underline">
          View lead
        </Link>
      ) : null}
      {message ? <p className="w-full text-sm text-leaf">{message}</p> : null}
    </div>
  );
}
