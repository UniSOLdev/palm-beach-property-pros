import type { Metadata } from "next";
import Link from "next/link";
import { QuoteForm } from "./quote-form";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request Your Free Quote",
  description: `Request a free quote from ${SITE_NAME}. Send photos, receive pricing quickly, and book through our secure quick access page—no obligation.`,
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
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/services" className="text-sm font-semibold text-ocean hover:underline">
            View services
          </Link>
          <a
            href={LINKR_URL}
            target="_blank"
            rel={linkrRel}
            className="btn-primary px-5 py-2.5 text-sm sm:inline-flex"
          >
            Open quick access page
          </a>
        </div>
        <div className="mt-10">
          <QuoteForm />
        </div>
      </section>
    </div>
  );
}
