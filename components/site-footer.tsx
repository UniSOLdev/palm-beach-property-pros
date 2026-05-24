import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SERVICES } from "@/lib/services";
import { PHONE_DISPLAY, PHONE_TEL, QUOTE_PATH, SERVICE_CITIES, SITE_NAME } from "@/lib/site";

const coreCities = SERVICE_CITIES.filter((c) => !c.toLowerCase().startsWith("and nearby"));

export function SiteFooter() {
  return (
    <footer className="border-t border-navy/10 bg-navy text-cream">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="inline-block rounded-xl bg-white p-3 shadow-md">
              <BrandLogo variant="footer" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-cream/85">
              {SITE_NAME} provides residential and commercial cleaning, window cleaning, pressure
              washing, detailing, carpet care, and property maintenance across Palm Beach County.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky/90">
                Services
              </p>
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm pr-2">
                <li>
                  <Link href="/services" className="text-cream/90 no-underline hover:text-white">
                    All services
                  </Link>
                </li>
                {SERVICES.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/services/${s.slug}`}
                      className="text-cream/90 no-underline hover:text-white"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/pricing" className="text-cream/90 no-underline hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/service-area" className="text-cream/90 no-underline hover:text-white">
                    Service area
                  </Link>
                </li>
                <li>
                  <Link href="/quote" className="text-cream/90 no-underline hover:text-white">
                    Quote details
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky/90">
                Cities served
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-cream/90">
                {coreCities.map((city) => (
                  <li key={city}>{city}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky/90">
                Contact
              </p>
              <ul className="mt-3 space-y-3 text-sm">
                <li>
                  <a href={PHONE_TEL} className="font-medium text-white no-underline hover:underline">
                    {PHONE_DISPLAY}
                  </a>
                </li>
                <li>
                  <Link
                    href={QUOTE_PATH}
                    className="text-cream/90 no-underline underline-offset-2 hover:text-white hover:underline"
                  >
                    Book service
                  </Link>
                  {" · "}
                  <a
                    href={PHONE_TEL}
                    className="text-cream/90 no-underline underline-offset-2 hover:text-white hover:underline"
                  >
                    Billing questions
                  </a>
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
