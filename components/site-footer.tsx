import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { PRIMARY_LOCATION_SLUGS, LOCATION_PAGES } from "@/lib/locations";
import { getServicePublicHref } from "@/lib/service-pages";
import { SERVICES } from "@/lib/services";
import { CTA } from "@/lib/cta";
import { PHONE_DISPLAY, PHONE_TEL, QUOTE_PATH, SITE_NAME } from "@/lib/site";

const primaryServices = [
  "window-cleaning",
  "pressure-washing",
  "recurring-lawn-driveway",
  "residential-cleaning",
  "commercial-cleaning",
  "property-maintenance",
  "auto-detailing",
] as const;

export function SiteFooter() {
  const locationLinks = PRIMARY_LOCATION_SLUGS.map(
    (slug) => LOCATION_PAGES.find((l) => l.slug === slug)!,
  );

  return (
    <footer className="relative border-t border-white/[0.06] bg-gradient-to-b from-navy to-navy-deep text-cream">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:px-6 md:py-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <BrandLogo variant="footer" />
            <p className="mt-4 text-sm leading-relaxed text-cream/85">
              {SITE_NAME} provides residential and commercial cleaning, window cleaning, pressure
              washing, property care, and mobile detailing across Palm Beach County.
            </p>
            <Link href={QUOTE_PATH} className="btn-primary mt-6 inline-flex text-sm">
              {CTA.primaryEstimate}
            </Link>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky/90">Services</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-cream/90 no-underline hover:text-white">
                    About us
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="text-cream/90 no-underline hover:text-white">
                    All services
                  </Link>
                </li>
                <li>
                  <Link href="/property-care" className="text-cream/90 no-underline hover:text-white">
                    Property &amp; estate care
                  </Link>
                </li>
                <li>
                  <Link
                    href="/vacation-home-checks"
                    className="text-cream/90 no-underline hover:text-white"
                  >
                    Vacation home checks
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mobile-detailing"
                    className="text-cream/90 no-underline hover:text-white"
                  >
                    Mobile detailing
                  </Link>
                </li>
                {primaryServices.map((slug) => {
                  const s = SERVICES.find((svc) => svc.slug === slug);
                  if (!s) return null;
                  return (
                    <li key={s.slug}>
                      <Link
                        href={getServicePublicHref(s.slug)}
                        className="text-cream/90 no-underline hover:text-white"
                      >
                        {s.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky/90">
                Service areas
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-cream/90">
                {locationLinks.map((loc) => (
                  <li key={loc.slug}>
                    <Link
                      href={`/areas/${loc.slug}`}
                      className="text-cream/90 no-underline hover:text-white"
                    >
                      {loc.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/service-area" className="text-cream/90 no-underline hover:text-white">
                    Full service area
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky/90">Contact</p>
              <ul className="mt-3 space-y-3 text-sm">
                <li>
                  <a
                    href={PHONE_TEL}
                    className="font-medium text-white no-underline hover:underline"
                    data-analytics-location="footer"
                  >
                    {PHONE_DISPLAY}
                  </a>
                </li>
                <li>
                  <Link
                    href={QUOTE_PATH}
                    className="text-cream/90 no-underline underline-offset-2 hover:text-white hover:underline"
                  >
                    {CTA.primaryEstimate}
                  </Link>
                </li>
                <li className="text-cream/75">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-sky/80">
                    Business hours
                  </span>
                  Monday–Saturday, 8 a.m.–6 p.m. (by appointment; hours may vary by season)
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-cream/90 no-underline hover:text-white hover:underline"
                  >
                    Privacy policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-8 text-center text-xs text-cream/60">
          © {new Date().getFullYear()} {SITE_NAME}. Serving Palm Beach County.
        </p>
      </div>
    </footer>
  );
}
