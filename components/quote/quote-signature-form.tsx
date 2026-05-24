"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useTransition } from "react";
import type ReactSignatureCanvas from "react-signature-canvas";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { QUOTE_SIGNATURE_LEGAL } from "@/lib/quotes/constants";
import type { PublicQuote, PublicQuoteItem } from "@/lib/quotes/types";

const SignaturePad = dynamic(() => import("@/components/quote/signature-pad"), { ssr: false });

type Props = {
  publicId: string;
  quote: PublicQuote;
  items: PublicQuoteItem[];
  subtotal: number;
};

export function QuoteSignatureForm({ publicId, quote, items, subtotal }: Props) {
  const [pending, startTransition] = useTransition();
  const [signedName, setSignedName] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<"signed" | "declined" | null>(null);
  const sigRef = useRef<ReactSignatureCanvas | null>(null);

  const isLocked = quote.approval_status === "signed" || quote.approval_status === "declined" || done !== null;

  if (quote.approval_status === "signed" || done === "signed") {
    return (
      <section className="rounded-2xl border border-leaf/40 bg-gradient-to-b from-leaf/15 to-white p-6 text-center shadow-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-leaf/25 text-2xl">✓</div>
        <h2 className="mt-4 text-xl font-bold text-navy">Estimate signed</h2>
        <p className="mt-2 text-sm text-charcoal/80">
          Thank you{quote.signed_name ? `, ${quote.signed_name.split(" ")[0]}` : ""}. Palm Beach Property Pros has your
          authorization on file.
        </p>
        {quote.signed_at ? (
          <p className="mt-3 text-xs text-charcoal/60">Signed {formatDate(quote.signed_at)}</p>
        ) : null}
        <p className="mt-4 text-sm font-semibold text-navy">Approved total: {formatCurrency(subtotal)}</p>
      </section>
    );
  }

  if (quote.approval_status === "declined" || done === "declined") {
    return (
      <section className="rounded-2xl border border-navy/10 bg-sand/50 p-6 text-center">
        <h2 className="text-xl font-bold text-navy">Response recorded</h2>
        <p className="mt-2 text-sm text-charcoal/80">
          We received your response. Our team will follow up if you have questions about this estimate.
        </p>
      </section>
    );
  }

  function getSignatureDataUrl(): string | null {
    const canvas = sigRef.current;
    if (!canvas || canvas.isEmpty()) return null;
    return canvas.getCanvas().toDataURL("image/png");
  }

  return (
    <section className="space-y-5 rounded-2xl border border-navy/10 bg-white/95 p-5 shadow-lg backdrop-blur-sm sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-navy">Approve this estimate</h2>
        <p className="mt-1 text-sm text-charcoal/70">Sign below to authorize work per the terms above.</p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <label className="block text-sm font-semibold text-navy">
        Full legal name
        <input
          className="mt-2 w-full min-h-[52px] rounded-xl border border-navy/15 bg-cream/30 px-4 text-base"
          value={signedName}
          onChange={(e) => setSignedName(e.target.value)}
          placeholder="Type your full name"
          autoComplete="name"
          disabled={pending}
        />
      </label>

      <div>
        <p className="text-sm font-semibold text-navy">Draw your signature</p>
        <div className="mt-2 overflow-hidden rounded-xl border-2 border-dashed border-navy/15 bg-cream/20">
          <SignaturePad
            ref={sigRef}
            penColor="#0f2a44"
            canvasProps={{
              className: "h-36 w-full touch-none",
              "aria-label": "Signature canvas",
            }}
          />
        </div>
        <button
          type="button"
          className="mt-2 text-xs font-semibold text-ocean underline"
          onClick={() => sigRef.current?.clear()}
          disabled={pending}
        >
          Clear signature
        </button>
      </div>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-charcoal/85">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 rounded border-navy/20"
          checked={authorized}
          onChange={(e) => setAuthorized(e.target.checked)}
          disabled={pending}
        />
        <span>{QUOTE_SIGNATURE_LEGAL}</span>
      </label>

      <button
        type="button"
        disabled={pending || !signedName.trim() || !authorized || isLocked}
        className="btn-primary-lg w-full disabled:opacity-60"
        onClick={() =>
          startTransition(async () => {
            setError("");
            const signatureDataUrl = getSignatureDataUrl();
            if (!signatureDataUrl) {
              setError("Please draw your signature in the box above.");
              return;
            }
            try {
              const res = await fetch("/api/quotes/sign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  publicId,
                  signedName: signedName.trim(),
                  signatureDataUrl,
                  authorized: true,
                }),
              });
              const data = await res.json();
              if (!data.ok) {
                setError(data.error ?? "Could not submit signature.");
                return;
              }
              setDone("signed");
            } catch {
              setError("Network error — please try again.");
            }
          })
        }
      >
        {pending ? "Submitting…" : "Approve & Sign"}
      </button>

      <details className="rounded-xl border border-navy/10 bg-cream/20 px-4 py-3">
        <summary className="min-h-[44px] cursor-pointer text-sm font-semibold text-charcoal/80">
          Decline this estimate
        </summary>
        <div className="mt-3 space-y-3">
          <textarea
            className="w-full rounded-xl border border-navy/15 p-3 text-sm"
            rows={3}
            placeholder="Optional reason (helps us follow up)"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            disabled={pending}
          />
          <button
            type="button"
            disabled={pending}
            className="w-full min-h-[48px] rounded-xl border-2 border-navy/20 text-sm font-semibold text-navy"
            onClick={() =>
              startTransition(async () => {
                setError("");
                try {
                  const res = await fetch("/api/quotes/decline", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ publicId, reason: declineReason.trim() || undefined }),
                  });
                  const data = await res.json();
                  if (!data.ok) {
                    setError(data.error ?? "Could not submit.");
                    return;
                  }
                  setDone("declined");
                } catch {
                  setError("Network error — please try again.");
                }
              })
            }
          >
            Decline Quote
          </button>
        </div>
      </details>
    </section>
  );
}

type ViewTrackerProps = { publicId: string };

export function QuoteViewTracker({ publicId }: ViewTrackerProps) {
  useEffect(() => {
    void fetch("/api/quotes/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    }).catch(() => undefined);
  }, [publicId]);
  return null;
}
