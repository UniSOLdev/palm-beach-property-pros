import type { Metadata } from "next";
import Link from "next/link";
import { QuoteForm } from "./quote-form";
import { CTA } from "@/lib/cta";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request Your Free Estimate",
  description: `Request a free estimate from ${SITE_NAME}. Send photos, your city, and project details—we will call or text you to confirm next steps.`,
  alternates: { canonical: `${SITE_URL}/quote` },
};

type Props = {
  searchParams: Promise<{ service?: string; audience?: string }>;
};

export default async function QuotePage({ searchParams }: Props) {
  const { service, audience } = await searchParams;
  const defaultService =
    audience === "commercial"
      ? "Commercial Cleaning"
      : audience === "residential"
        ? "Residential Cleaning"
        : service;

  return (
    <div className="bg-cream">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Estimate</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          {CTA.primaryEstimate}
        </h1>
        <p className="mt-4 text-lg text-charcoal/85">
          Send photos of the areas you want serviced, your city or ZIP code, and a short project
          description. We will call or text you to confirm details—there is no obligation to book.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/services" className="text-sm font-semibold text-ocean hover:underline">
            View services
          </Link>
          <a href={PHONE_TEL} className="btn-primary px-5 py-2.5 text-sm sm:inline-flex">
            Call {PHONE_DISPLAY}
          </a>
        </div>
        <div className="mt-10">
          <QuoteForm defaultService={defaultService} />
        </div>
      </section>
    </div>
  );
}
