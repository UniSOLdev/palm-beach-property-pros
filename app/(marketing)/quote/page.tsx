import type { Metadata } from "next";
import Link from "next/link";
import { QuoteForm } from "./quote-form";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { SITE_NAME } from "@/lib/site";
import { getBusinessSettings } from "@/lib/admin/queries";
import {
  buildInvoicePaymentInstructionText,
  resolveBookingHref,
  resolveBookingLabel,
  resolvePaymentCtaLabel,
} from "@/lib/booking-settings";

export const metadata: Metadata = {
  title: "Request Your Free Quote",
  description: `Request a free quote from ${SITE_NAME}. Send photos, receive pricing quickly, and book through our secure quick access page—no obligation.`,
};

export default async function QuotePage() {
  const settings = await getBusinessSettings();
  const bookingHref = resolveBookingHref(settings);
  const bookingLabel = resolveBookingLabel(settings);
  const bookingExternal = bookingHref.startsWith("http");
  const payUrl = settings.squareInvoiceUrl?.trim();
  const payText = buildInvoicePaymentInstructionText(settings);

  return (
    <div className="bg-cream">
      <section className="mx-auto w-full max-w-3xl py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Quote</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">Request Your Free Quote</h1>
        <p className="mt-4 text-lg text-charcoal/85">
          Send photos of the areas you want serviced, note your city and timing, and we return
          scope-based pricing quickly. There is no obligation to book.
        </p>
        <p className="mt-3 text-sm text-charcoal/75">
          We do not share your information. It is used only to estimate and schedule work you
          approve in writing.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/services" className="text-sm font-semibold text-ocean hover:underline">
            View services
          </Link>
          <div className="flex flex-wrap gap-2">
            {bookingExternal ? (
              <a href={bookingHref} target="_blank" rel="noopener noreferrer" className="btn-primary px-5 py-2.5 text-sm sm:inline-flex">
                {bookingLabel}
              </a>
            ) : (
              <Link href={bookingHref} className="btn-primary px-5 py-2.5 text-sm no-underline sm:inline-flex">
                {bookingLabel}
              </Link>
            )}
            {payUrl ? (
              <a href={payUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary px-5 py-2.5 text-sm sm:inline-flex">
                {resolvePaymentCtaLabel(settings)}
              </a>
            ) : null}
            <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-secondary px-5 py-2.5 text-sm sm:inline-flex">
              Open quick access page
            </a>
          </div>
        </div>
        {!payUrl && payText ? (
          <p className="mt-6 whitespace-pre-line rounded-2xl border border-navy/10 bg-white/80 p-4 text-sm text-charcoal/80">{payText}</p>
        ) : null}
        <div className="mt-10">
          <QuoteForm />
        </div>
      </section>
    </div>
  );
}
