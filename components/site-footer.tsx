import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import type { CmsSiteShellPublished } from "@/lib/cms-types";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { SERVICES } from "@/lib/services";
import { PHONE_DISPLAY, PHONE_TEL, SERVICE_CITIES, SITE_NAME } from "@/lib/site";

const coreCities = SERVICE_CITIES.filter((c) => !c.toLowerCase().startsWith("and nearby"));

export type SiteFooterProps = {
  shell?: CmsSiteShellPublished | null;
  logoUrl?: string | null;
};

export function SiteFooter({ shell, logoUrl }: SiteFooterProps) {
  const blurb =
    shell?.footer_blurb ??
    `${SITE_NAME} delivers premium property operations across Palm Beach County: exterior care, interior care, turnovers, maintenance, and recurring property care plans—licensed, insured, and built for repeat trust.`;
  const hours =
    shell?.business_hours ??
    "Monday–Saturday, 8 a.m.–6 p.m. (by appointment; hours may vary by season)";
  const linkrCaption = shell?.footer_linkr_caption ?? "Book service · Pay invoice · Leave a review";

  return (
    <footer className="border-t border-white/[0.06] bg-navy text-cream">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-11">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <BrandLogo variant="footer" surface="dark" logoSrc={logoUrl} />
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-cream/65">{blurb}</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3 lg:gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-aqua/80">Services</p>
              <ul className="mt-2.5 max-h-56 space-y-1.5 overflow-y-auto text-[13px] pr-2">
                <li>
                  <Link href="/services" className="text-cream/75 no-underline transition hover:text-cream">
                    All services
                  </Link>
                </li>
                {SERVICES.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/services/${s.slug}`}
                      className="text-cream/75 no-underline transition hover:text-cream"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/pricing" className="text-cream/75 no-underline transition hover:text-cream">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/service-area" className="text-cream/75 no-underline transition hover:text-cream">
                    Service area
                  </Link>
                </li>
                <li>
                  <Link href="/quote" className="text-cream/75 no-underline transition hover:text-cream">
                    Quote details
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-aqua/80">Cities served</p>
              <ul className="mt-2.5 space-y-1 text-[13px] text-cream/70">
                {coreCities.map((city) => (
                  <li key={city}>{city}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-aqua/80">Contact</p>
              <ul className="mt-2.5 space-y-2.5 text-[13px]">
                <li>
                  <a href={PHONE_TEL} className="font-medium text-cream/90 no-underline transition hover:text-cream">
                    {PHONE_DISPLAY}
                  </a>
                </li>
                <li>
                  <a
                    href={LINKR_URL}
                    target="_blank"
                    rel={linkrRel}
                    className="text-cream/70 no-underline underline-offset-2 transition hover:text-cream hover:underline"
                  >
                    {linkrCaption}
                  </a>
                </li>
                <li className="text-cream/60">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-aqua/70">
                    Business hours
                  </span>
                  <span className="mt-1 block leading-relaxed">{hours}</span>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-cream/70 no-underline transition hover:text-cream hover:underline"
                  >
                    Privacy policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-8 border-t border-white/[0.06] pt-6 text-center text-[11px] tracking-wide text-cream/45">
          © {new Date().getFullYear()} {SITE_NAME}. Serving Palm Beach County.
        </p>
      </div>
    </footer>
  );
}
