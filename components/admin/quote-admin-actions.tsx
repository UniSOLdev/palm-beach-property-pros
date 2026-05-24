"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { copyQuotePublicLink, markQuoteSent } from "@/lib/admin/actions/quotes";

type Props = {
  quoteId: string;
  publicUrl: string;
  clientPhone: string | null;
  clientEmail: string | null;
};

export function QuoteAdminActions({ quoteId, publicUrl, clientPhone, clientEmail }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<void>) {
    setMessage(null);
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
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          className="admin-btn min-h-[48px]"
          onClick={() =>
            run(async () => {
              const result = await markQuoteSent(quoteId);
              if (result.smsHref) {
                window.open(result.smsHref, "_blank");
                setMessage("Marked sent — SMS composer opened.");
              } else if (result.mailtoHref) {
                window.location.href = result.mailtoHref;
                setMessage("Marked sent — email composer opened.");
              } else {
                setMessage("Marked sent. Share the public link with your client.");
              }
            })
          }
        >
          Send Quote
        </button>
        <button
          type="button"
          disabled={pending}
          className="admin-btn-secondary min-h-[48px]"
          onClick={() =>
            run(async () => {
              const link = await copyQuotePublicLink(quoteId);
              await navigator.clipboard.writeText(link);
              setMessage("Public link copied to clipboard.");
            })
          }
        >
          Copy Public Link
        </button>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn-secondary min-h-[48px] no-underline"
        >
          Preview →
        </a>
      </div>
      {(clientPhone || clientEmail) && (
        <p className="text-xs text-charcoal/50">
          Send opens {clientPhone ? "SMS" : "email"} to client when contact info is on file.
        </p>
      )}
      {message ? <p className="rounded-xl bg-leaf/15 px-4 py-3 text-sm text-navy">{message}</p> : null}
      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
