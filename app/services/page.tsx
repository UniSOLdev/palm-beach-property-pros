import type { Metadata } from "next";
import Link from "next/link";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { SERVICES } from "@/lib/services";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cleaning & Property Services",
  description: `${SITE_NAME} — window cleaning, pressure washing, residential and commercial cleaning, detailing, carpet care, and maintenance in Palm Beach County. Licensed & insured.`,
};

export default function ServicesPage() {
  return (
    <div className="bg-cream">
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-ocean">Services</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-navy md:text-4xl">
            One local team for cleaning, detailing, and property care
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/85">
            Browse services by property type, then open our quick access page to request pricing,
            book work, pay invoices, or leave a review.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary">
              Get a free quote
            </a>
            <a
              href={LINKR_URL}
              target="_blank"
              rel={linkrRel}
              className="btn-secondary border-ocean/40"
            >
              Book service
            </a>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {SERVICES.map((s) => (
              <article
                key={s.slug}
                id={s.anchor}
                className="scroll-mt-28 rounded-xl border border-navy/10 bg-white p-6 shadow-md transition duration-200 hover:shadow-lg"
              >
                <h2 className="text-xl font-bold text-navy">{s.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/90">{s.shortDescription}</p>
                <p className="mt-3 text-sm font-medium text-ocean">Best for</p>
                <p className="text-sm text-charcoal/85">{s.bestFor}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/services/${s.slug}`}
                    className="btn-primary px-4 py-2 text-xs sm:text-sm"
                  >
                    Learn more
                  </Link>
                  <a
                    href={LINKR_URL}
                    target="_blank"
                    rel={linkrRel}
                    className="btn-secondary px-4 py-2 text-xs sm:text-sm"
                  >
                    Request pricing
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
