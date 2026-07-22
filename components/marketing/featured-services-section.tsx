import Link from "next/link";
import type { SiteService } from "@/lib/site-content/types";
import { QUOTE_PATH } from "@/lib/site";

export function FeaturedServicesSection({ services }: { services: SiteService[] }) {
  if (!services.length) return null;

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="section-eyebrow text-ocean">Core services</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Window detailing &amp; pressure washing—plus full property care
          </h2>
          <p className="mt-4 text-base leading-relaxed text-charcoal/85 sm:text-lg">
            Priority services for curb appeal and exterior renewal, alongside cleaning, maintenance,
            and ongoing property support throughout Palm Beach County.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.id}
              className="flex h-full flex-col rounded-2xl border border-navy/10 bg-white p-6 shadow-md"
            >
              <h3 className="text-xl font-bold text-navy">{service.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal/85">
                {service.short_description}
              </p>
              {service.included.length ? (
                <ul className="mt-4 space-y-1.5 text-sm text-charcoal/80">
                  {service.included.slice(0, 4).map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-leaf" aria-hidden>
                        •
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link href={`/services/${service.slug}`} className="btn-secondary px-4 py-2.5 text-sm">
                  Learn more
                </Link>
                <Link
                  href={`${QUOTE_PATH}?service=${encodeURIComponent(service.title)}`}
                  className="btn-primary px-4 py-2.5 text-sm"
                >
                  Free estimate
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/services" className="text-sm font-semibold text-ocean hover:underline">
            View all services →
          </Link>
        </div>
      </div>
    </section>
  );
}
