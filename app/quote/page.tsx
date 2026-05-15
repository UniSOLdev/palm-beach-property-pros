import type { Metadata } from "next";
import Link from "next/link";
import { QuoteForm } from "./quote-form";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request Your Free Quote",
  description: `Request a free quote from ${SITE_NAME}. Send photos, receive pricing quickly, and coordinate service on the PBPP platform—no obligation.`,
};

export default function QuotePage() {
  return (
    <div className="bg-cream">
      <section className="mx-auto w-full max-w-3xl py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Quote</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Request Your Free Quote
        </h1>
        <p className="mt-4 text-lg text-charcoal/85">
          Send photos of the areas you want serviced, note your city and timing, and we return
          scope-based pricing quickly. There is no obligation to book.
        </p>
        <p className="mt-3 text-sm text-charcoal/75">
          We do not share your information. It is used only to estimate and schedule work you
          approve in writing.
        </p>
        <div className="mt-8">
          <Link href="/services" className="text-sm font-semibold text-ocean hover:underline">
            View services
          </Link>
        </div>
        <div className="mt-10">
          <QuoteForm />
        </div>
      </section>
    </div>
  );
}
