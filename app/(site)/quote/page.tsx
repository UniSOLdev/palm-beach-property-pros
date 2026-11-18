import type { Metadata } from "next";
import { QuoteForm } from "@/components/site/quote-form";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request a Private Quote",
  description:
    "Request a private, no-obligation quote for home watch and household services in Palm Beach Gardens, Jupiter, North Palm Beach, and Palm Beach. We'll call you at the time you prefer.",
  alternates: { canonical: "/quote" },
};

export default function QuotePage() {
  return (
    <section className="bg-cream py-16 sm:py-20">
      <div className="site-container grid gap-12 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="eyebrow">Private quote</p>
          <h1 className="font-display mt-3 text-5xl font-medium leading-tight text-navy sm:text-6xl">
            Request a private quote.
          </h1>
          <p className="lead-text mt-6">
            Tell us a little about your home and when to call. Clayton will call you personally,
            usually within one business day. There is no obligation.
          </p>
          <p className="mt-8 text-lg text-charcoal/90">Prefer to talk now?</p>
          <a href={PHONE_TEL} className="btn-navy mt-3">
            Call {PHONE_DISPLAY}
          </a>
        </div>
        <QuoteForm idPrefix="quote" />
      </div>
    </section>
  );
}
