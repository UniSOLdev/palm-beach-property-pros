import type { Metadata } from "next";
import Link from "next/link";
import { getSiteServices } from "@/lib/site-content/queries";
import { QUOTE_PATH, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cleaning & Property Services",
  description: `${SITE_NAME} — complete window detailing, pressure washing, residential and commercial cleaning, detailing, carpet care, and maintenance in Palm Beach County. Licensed & insured.`,
};

export default async function ServicesPage() {
  const services = await getSiteServices({ activeOnly: true });
  const featured = services.filter((s) => s.is_featured);
  const others = services.filter((s) => !s.is_featured);

  return (
    <div className="bg-cream">
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-ocean">Services</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Window detailing, pressure washing &amp; full property care
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/85">
            Browse services by property type, then request a free estimate with photos through Palm Beach
            Property Pros.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={QUOTE_PATH} className="btn-primary">
              Request a Free Estimate
            </Link>
            <Link href="/projects" className="btn-secondary border-ocean/40">
              View recent work
            </Link>
          </div>

          {featured.length ? (
            <div className="mt-14">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ocean">Featured services</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {featured.map((s) => (
                  <ServiceCard key={s.id} service={s} highlight />
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {(featured.length ? others : services).map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({
  service: s,
  highlight = false,
}: {
  service: Awaited<ReturnType<typeof getSiteServices>>[number];
  highlight?: boolean;
}) {
  return (
    <article
      id={s.slug}
      className={`scroll-mt-28 rounded-xl border bg-white p-6 shadow-md transition duration-200 hover:shadow-lg ${
        highlight ? "border-ocean/30 ring-1 ring-ocean/10" : "border-navy/10"
      }`}
    >
      <h2 className="text-xl font-bold text-navy">{s.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/90">{s.short_description}</p>
      {s.best_for ? (
        <>
          <p className="mt-3 text-sm font-medium text-ocean">Best for</p>
          <p className="text-sm text-charcoal/85">{s.best_for}</p>
        </>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/services/${s.slug}`} className="btn-primary px-4 py-2 text-xs sm:text-sm">
          Learn more
        </Link>
        <Link
          href={`${QUOTE_PATH}?service=${encodeURIComponent(s.title)}`}
          className="btn-secondary px-4 py-2 text-xs sm:text-sm"
        >
          Free estimate
        </Link>
      </div>
    </article>
  );
}
