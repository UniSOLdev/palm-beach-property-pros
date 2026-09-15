import type { Metadata } from "next";
import { PageHeroImage } from "@/components/marketing/page-hero-image";
import { getSiteHeroFallback } from "@/lib/marketing/service-images";
import { QuoteForm } from "./quote-form";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Get a Free Quote",
  description: `Request a free quote from ${SITE_NAME}. Send photos, get scope-based pricing fast — no obligation.`,
};

type Props = {
  searchParams: Promise<{ service?: string }>;
};

const STEPS = [
  "Tell us how to reach you",
  "Property & service details",
  "Photos & timing (optional)",
] as const;

export default async function QuotePage({ searchParams }: Props) {
  const { service } = await searchParams;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-cream via-cream to-cream-warm/50">
      <div className="mx-auto mb-6 max-w-6xl px-2 md:hidden">
        <PageHeroImage asset={getSiteHeroFallback()} className="shadow-luxury" />
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-2 py-6 sm:px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-14 lg:py-12">
        <aside className="lg:sticky lg:top-24">
          <p className="section-eyebrow text-ocean">Quote</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Get pricing in minutes
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-charcoal/75">
            Three quick steps. Add photos for faster, accurate scope — we reply by call, text, or
            email.
          </p>

          <ol className="mt-8 hidden space-y-3 lg:block">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-start gap-3 text-sm text-charcoal/70">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy">
                  {i + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>

          <ul className="mt-8 space-y-2 text-sm text-charcoal/65">
            <li>✓ Residential & commercial</li>
            <li>✓ Restoration, cleaning & maintenance</li>
            <li>✓ No carpentry — field crews only</li>
          </ul>

          <a
            href={PHONE_TEL}
            className="mt-8 inline-flex text-sm font-semibold text-ocean no-underline hover:underline"
          >
            Prefer to talk? {PHONE_DISPLAY}
          </a>
        </aside>

        <div>
          <QuoteForm defaultService={service} />
        </div>
      </div>
    </div>
  );
}
