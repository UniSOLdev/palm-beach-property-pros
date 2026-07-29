import Link from "next/link";
import { PRIMARY_LOCATION_SLUGS, LOCATION_PAGES } from "@/lib/locations";
import { SITE_NAME } from "@/lib/site";

export function ServiceAreaSection() {
  const primaryLocations = PRIMARY_LOCATION_SLUGS.map(
    (slug) => LOCATION_PAGES.find((l) => l.slug === slug)!,
  );

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-navy via-navy to-navy-deep py-14 text-cream shadow-luxury md:rounded-3xl md:py-16">
      <div className="absolute inset-0 bg-luxury-radial opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <p className="section-eyebrow text-aqua/80">Service area</p>
        <h2 className="section-title text-cream">Palm Beach County &amp; nearby communities</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-cream/85">
          {SITE_NAME} serves homeowners, property managers, and businesses throughout Palm Beach
          County—from coastal estates to downtown storefronts.
        </p>
        <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
          {primaryLocations.map((loc) => (
            <li key={loc.slug}>
              <Link
                href={`/areas/${loc.slug}`}
                className="inline-block rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-cream/90 no-underline backdrop-blur-sm transition hover:border-aqua/40 hover:text-cream"
              >
                {loc.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/service-area"
          className="mt-8 inline-block text-sm font-semibold tracking-wide text-aqua no-underline transition duration-300 hover:text-cream"
        >
          View full service area →
        </Link>
      </div>
    </section>
  );
}
