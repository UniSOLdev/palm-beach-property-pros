import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, servicesIn } from "@/lib/site/catalog";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-navy-deep pb-32 pt-20 text-cream lg:pb-14">
      <div className="site-container">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <Image src="/brand/pbpp-wordmark-light.svg" alt="Palm Beach Property Pros" width={280} height={42} className="h-10 w-auto" />
            <p className="font-display mt-6 max-w-md text-3xl leading-snug">Palm Beach homes, impeccably kept.</p>
          </div>
          <div className="md:text-right">
            <a href={PHONE_TEL} className="font-display text-4xl text-brass-light no-underline hover:underline">
              {PHONE_DISPLAY}
            </a>
            <p className="mt-2 text-base text-cream/75">Private quotes by phone or request.</p>
          </div>
        </div>
        <div className="grid gap-10 pt-12 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <div key={c.id}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-cream/70">{c.eyebrow}</h2>
              <ul className="mt-5 space-y-3">
                {servicesIn(c.id).map((s) => (
                  <li key={s.slug}>
                    <Link href={`/services/${s.slug}`} className="text-base text-cream/90 no-underline hover:text-brass-light">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-8 text-sm text-cream/65 sm:flex-row sm:justify-between">
          <p>© {year} Palm Beach Property Pros LLC · Licensed &amp; insured · Palm Beach County, Florida</p>
          <div className="flex gap-6">
            <Link href="/service-area" className="text-cream/65 no-underline hover:text-cream">Service area</Link>
            <Link href="/pricing" className="text-cream/65 no-underline hover:text-cream">Private quotes</Link>
            <Link href="/privacy" className="text-cream/65 no-underline hover:text-cream">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
