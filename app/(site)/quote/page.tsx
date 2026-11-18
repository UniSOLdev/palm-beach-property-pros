import type { Metadata } from "next";
import { QuoteForm } from "@/components/site/quote-form";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request a Private Quote",
  description:
    "Request a private, no-obligation quote for estate cleaning, exterior care, pressure washing, detailing, property maintenance, or home watch in Palm Beach County.",
  alternates: { canonical: "/quote" },
};

export default function QuotePage() {
  return (
    <section className="-mt-[72px] bg-cream-warm pb-24 pt-[calc(72px+4rem)] sm:pt-[calc(72px+6rem)]">
      <div className="site-container grid gap-14 lg:grid-cols-[1fr_1.35fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-dark">Private quote</p>
          <h1 className="font-display mt-4 text-5xl font-medium leading-[1.05] text-navy sm:text-6xl">Let&apos;s talk about your property.</h1>
          <p className="mt-6 text-lg leading-relaxed text-charcoal/80 sm:text-xl">
            Share a few details and we&apos;ll respond personally, typically within one business day, with a clear, written quote. No obligation.
          </p>
          <div className="mt-10 border-t border-navy/10 pt-8">
            <p className="text-base text-charcoal/70">Prefer to speak with someone?</p>
            <a href={PHONE_TEL} className="font-display mt-2 block text-4xl text-navy no-underline hover:text-brass-dark">{PHONE_DISPLAY}</a>
          </div>
        </div>
        <QuoteForm idPrefix="quote" />
      </div>
    </section>
  );
}
