import Link from "next/link";
import { SERVICE_AREAS, SERVICES } from "@/lib/site/content";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-navy-deep pb-28 pt-16 text-cream md:pb-12">
      <div className="site-container grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl">{SITE_NAME}</p>
          <p className="mt-3 max-w-sm text-lg leading-relaxed text-cream/85">
            Discreet home watch and household services for the Palm Beaches.
          </p>
          <a
            href={PHONE_TEL}
            className="mt-5 inline-block text-2xl font-semibold text-brass-light no-underline hover:underline"
          >
            {PHONE_DISPLAY}
          </a>
          <p className="mt-2 text-base text-cream/80">Private quotes by phone or request.</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cream/80">Services</h2>
          <ul className="mt-4 space-y-2.5">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="text-base text-cream/90 no-underline hover:text-brass-light">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cream/80">Service area</h2>
          <ul className="mt-4 space-y-2.5">
            {SERVICE_AREAS.map((a) => (
              <li key={a.slug} className="text-base text-cream/90">
                {a.name}
              </li>
            ))}
          </ul>
          <Link href="/quote" className="mt-6 inline-block text-base font-semibold text-brass-light no-underline hover:underline">
            Request a private quote →
          </Link>
        </div>
      </div>
      <div className="site-container mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-cream/70 sm:flex-row sm:justify-between">
        <p>© {year} Palm Beach Property Pros LLC. All rights reserved.</p>
        <Link href="/privacy" className="text-cream/70 no-underline hover:text-cream">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
