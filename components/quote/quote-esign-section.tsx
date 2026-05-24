"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import SignaturePad from "@/components/quote/signature-pad";
import type ReactSignatureCanvas from "react-signature-canvas";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { QUOTE_SIGNATURE_LEGAL, type QuoteApprovalStatus } from "@/lib/quotes/constants";

export type QuoteESignSectionProps = {
  publicId: string;
  approvalStatus: QuoteApprovalStatus;
  signedName: string | null;
  signedAt: string | null;
  clientName: string | null;
  total: number;
  signaturePreviewUrl: string | null;
  pdfDownloadUrl: string | null;
};

export function QuoteViewTracker({ publicId }: { publicId: string }) {
  useEffect(() => {
    void fetch("/api/quotes/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    }).catch(() => undefined);
  }, [publicId]);
  return null;
}

export function QuoteESignSection({
  publicId,
  approvalStatus,
  signedName,
  signedAt,
  clientName,
  total,
  signaturePreviewUrl,
  pdfDownloadUrl,
}: QuoteESignSectionProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [nameInput, setNameInput] = useState(clientName ?? signedName ?? "");
  const [authorized, setAuthorized] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [error, setError] = useState("");
  const [localStatus, setLocalStatus] = useState<QuoteApprovalStatus | null>(null);
  const sigRef = useRef<ReactSignatureCanvas | null>(null);

  useEffect(() => setMounted(true), []);

  const status = localStatus ?? approvalStatus;
  const displayName = signedName ?? nameInput;
  const firstName = displayName.trim().split(/\s+/)[0] || "there";

  if (status === "signed") {
    return (
      <section
        id="quote-esign"
        className="rounded-2xl border border-leaf/40 bg-gradient-to-b from-leaf/15 to-white p-6 shadow-md"
        aria-label="Signed estimate confirmation"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-leaf/25 text-2xl">✓</div>
        <h2 className="mt-4 text-center text-xl font-bold text-navy">Estimate signed</h2>
        <p className="mt-2 text-center text-sm text-charcoal/80">
          Thank you, {firstName}. Palm Beach Property Pros has your authorization on file.
        </p>
        {signedAt ? (
          <p className="mt-3 text-center text-xs text-charcoal/60">
            Signed by {displayName} · {formatDate(signedAt)}
          </p>
        ) : displayName ? (
          <p className="mt-3 text-center text-xs text-charcoal/60">Signed by {displayName}</p>
        ) : null}
        <p className="mt-4 text-center text-sm font-semibold text-navy">
          Approved total: {total > 0 ? formatCurrency(total) : "Per estimate"}
        </p>

        {signaturePreviewUrl ? (
          <div className="mt-5 overflow-hidden rounded-xl border border-navy/10 bg-cream/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal/50">Your signature</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signaturePreviewUrl} alt="Your signature" className="mx-auto max-h-28 w-full object-contain" />
          </div>
        ) : null}

        {pdfDownloadUrl ? (
          <a
            href={pdfDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-5 flex w-full min-h-[52px] items-center justify-center no-underline"
          >
            Download signed PDF
          </a>
        ) : null}
      </section>
    );
  }

  if (status === "declined") {
    return (
      <section id="quote-esign" className="rounded-2xl border border-navy/10 bg-sand/50 p-6 text-center">
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
    <section
      id="quote-esign"
      className="space-y-5 rounded-2xl border-2 border-ocean/20 bg-white p-5 shadow-lg sm:p-6"
      aria-label="Approve and sign estimate"
    >
      <div className="text-center sm:text-left">
        <h2 className="text-lg font-bold text-navy">Approve & Sign Quote</h2>
        <p className="mt-1 text-sm text-charcoal/70">
          Review the estimate above, then sign below to authorize work.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <label className="block text-sm font-semibold text-navy">
        Typed full name (legal signature)
        <input
          className="mt-2 w-full min-h-[52px] rounded-xl border border-navy/15 bg-cream/30 px-4 text-base"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Type your full legal name"
          autoComplete="name"
          disabled={pending}
          required
        />
      </label>

      <div>
        <p className="text-sm font-semibold text-navy">Signature</p>
        <div className="mt-2 overflow-hidden rounded-xl border-2 border-dashed border-navy/20 bg-cream/20">
          {mounted ? (
            <SignaturePad
              ref={sigRef}
              penColor="#0f2a44"
              canvasProps={{
                className: "h-40 w-full touch-none cursor-crosshair",
                "aria-label": "Draw your signature",
              }}
            />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-charcoal/50">Loading signature pad…</div>
          )}
        </div>
        <button
          type="button"
          className="mt-2 text-xs font-semibold text-ocean underline"
          onClick={() => sigRef.current?.clear()}
          disabled={pending || !mounted}
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
        disabled={pending || !nameInput.trim() || !authorized}
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
                  signedName: nameInput.trim(),
                  signatureDataUrl,
                  authorized: true,
                }),
              });
              const data = (await res.json()) as { ok?: boolean; error?: string };
              if (!data.ok) {
                setError(data.error ?? "Could not submit signature.");
                return;
              }
              setLocalStatus("signed");
              router.refresh();
            } catch {
              setError("Network error — please try again.");
            }
          })
        }
      >
        {pending ? "Submitting…" : "Accept & Sign"}
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
                  const data = (await res.json()) as { ok?: boolean; error?: string };
                  if (!data.ok) {
                    setError(data.error ?? "Could not submit.");
                    return;
                  }
                  setLocalStatus("declined");
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
