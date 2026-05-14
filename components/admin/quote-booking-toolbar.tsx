"use client";

import { useCallback, useState } from "react";

import { markQuoteDepositReceivedAction } from "@/lib/admin/actions";

export function QuoteBookingToolbar({
  quoteId,
  quotePublicId,
  siteOrigin,
  bookingHref,
  squareBookingUrl,
  depositInstructions,
  depositReceived,
}: {
  quoteId: string;
  quotePublicId: string;
  siteOrigin: string;
  bookingHref: string;
  squareBookingUrl: string;
  depositInstructions: string;
  depositReceived: boolean;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const pushToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const bookingLink =
    bookingHref.startsWith("http")
      ? bookingHref
      : siteOrigin
        ? `${siteOrigin.replace(/\/$/, "")}${bookingHref.startsWith("/") ? bookingHref : `/${bookingHref}`}`
        : bookingHref;

  return (
    <div className="mb-6 print:hidden">
      {toast ? (
        <div className="mb-3 rounded-xl bg-navy px-3 py-2 text-sm font-semibold text-white">{toast}</div>
      ) : null}
      <div className="flex flex-col gap-2 rounded-2xl border border-navy/10 bg-white p-4 shadow-card sm:flex-row sm:flex-wrap sm:items-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55 sm:mr-2">Booking & deposit</span>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => {
            void navigator.clipboard.writeText(bookingLink);
            pushToast("Copied booking link");
          }}
        >
          Copy booking link
        </button>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => {
            void navigator.clipboard.writeText(depositInstructions || "—");
            pushToast("Copied deposit instructions");
          }}
        >
          Copy deposit instructions
        </button>
        {squareBookingUrl ? (
          <a href={squareBookingUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-center text-sm no-underline">
            Open Square booking
          </a>
        ) : (
          <button type="button" className="btn-secondary text-sm opacity-60" disabled title="Add Square booking URL in Settings">
            Open Square booking
          </button>
        )}
        {depositReceived ? (
          <span className="rounded-full bg-leaf/25 px-3 py-1 text-xs font-semibold text-navy">Deposit received</span>
        ) : (
          <form action={markQuoteDepositReceivedAction} className="inline">
            <input type="hidden" name="quote_id" value={quoteId} />
            <button type="submit" className="btn-primary text-sm">
              Mark deposit received
            </button>
          </form>
        )}
        <span className="text-xs text-charcoal/50 sm:ml-auto">Client view: /view/quote/{quotePublicId}</span>
      </div>
    </div>
  );
}
