import Link from "next/link";
import { BeforeAfterCompare } from "@/components/media/before-after-compare";
import { CoreServicesShowcase } from "@/components/marketing/core-services-showcase";
import { CuratedHeroMedia, FallbackHeroMedia } from "@/components/marketing/curated-hero-media";
import { HowItWorksStrip } from "@/components/marketing/how-it-works-strip";
import {
  HeroScrollFade,
  ScrollReveal,
  ScrollRevealItem,
  ScrollRevealStagger,
} from "@/components/marketing/scroll-reveal";
import { FAQ_ITEMS } from "@/lib/faq";
import { LOCAL_MARKETS, MEDIA_REGISTRY } from "@/lib/media";
import type { HomepageMediaBundle } from "@/lib/media/homepage-media";
import { buildMediaUrl } from "@/lib/media/resolve";
import { BRAND_HEADLINE, BRAND_SUBHEAD, HERO_CHIPS } from "@/lib/marketing/brand";
import { PHONE_DISPLAY, PHONE_TEL, QUOTE_PATH, SITE_NAME } from "@/lib/site";

const FALLBACK_HERO = MEDIA_REGISTRY.hero.primary;

const TRUST = [
  { title: "Written scope", body: "Clear pricing before crews dispatch." },
  { title: "Local crews", body: "County-native scheduling and access." },
  { title: "Photo proof", body: "Before & after when you want it." },
] as const;

const MINI_FAQ = FAQ_ITEMS.slice(0, 3);

export function PremiumHomePage({ media }: { media: HomepageMediaBundle }) {
  const useCuratedHero = media.hasAuthenticMedia && media.curatedHeroImage;
  const fallbackHeroSrc = buildMediaUrl(FALLBACK_HERO.src, 2000);
  const featured = media.transformations[0];
  const showProof = media.hasAuthenticMedia && featured;

  return (
    <>
      <section className="hero-cinematic animate-fade-up relative -mx-4 sm:-mx-6 md:mx-0 md:rounded-3xl">
        {useCuratedHero ? (
          <CuratedHeroMedia heroImage={media.curatedHeroImage} />
        ) : (
          <FallbackHeroMedia src={fallbackHeroSrc} alt={FALLBACK_HERO.alt} />
        )}

        <HeroScrollFade>
          <div className="relative z-10 px-4 py-20 sm:px-6 sm:py-24 md:px-10 md:py-28">
            <div className="max-w-xl md:max-w-2xl">
              <p className="section-eyebrow text-aqua/90">Palm Beach Property Pros</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-cream sm:text-5xl md:text-[3rem]">
                {BRAND_HEADLINE}
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-silver/95 sm:text-lg">
                {BRAND_SUBHEAD}
              </p>
            </div>

            <ul className="mt-8 flex flex-wrap justify-center gap-2 md:justify-start">
              {HERO_CHIPS.map((chip) => (
                <li key={chip} className="luxury-pill">
                  {chip}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row md:gap-4">
              <Link href={QUOTE_PATH} className="btn-hero-primary min-h-[52px] w-full sm:w-auto">
                Get a free quote
              </Link>
              <a href={PHONE_TEL} className="btn-hero-secondary min-h-[52px] w-full sm:w-auto">
                {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </HeroScrollFade>
      </section>

      <CoreServicesShowcase />

      <HowItWorksStrip />

      {showProof ? (
        <ScrollReveal>
          <section className="py-14 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-eyebrow text-ocean">Proof</p>
              <h2 className="section-title mt-3">Real work, documented</h2>
            </div>
            <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">
              <BeforeAfterCompare project={featured} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-aqua-muted">
                  {featured.timeframe}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-navy">{featured.title}</h3>
                <p className="mt-1 text-sm text-charcoal/60">{featured.location}</p>
                <p className="mt-4 text-sm leading-relaxed text-charcoal/75">{featured.summary}</p>
                <Link href={QUOTE_PATH} className="link-luxury mt-6 inline-block">
                  Request similar work
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>
      ) : null}

      <ScrollReveal>
        <section className="section-band-light py-12 md:py-16">
          <ScrollRevealStagger className="grid gap-6 md:grid-cols-3 md:gap-8">
            {TRUST.map((item) => (
              <ScrollRevealItem key={item.title}>
                <div className="text-center md:text-left">
                  <h3 className="text-sm font-semibold text-navy">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{item.body}</p>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealStagger>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="py-12 text-center md:py-16">
          <p className="section-eyebrow text-ocean">Service area</p>
          <h2 className="section-title mt-3">Palm Beach County</h2>
          <p className="section-lead mt-4">
            West Palm Beach, Gardens, Jupiter, Delray, and communities countywide.
          </p>
          <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
            {LOCAL_MARKETS.slice(0, 8).map((market) => (
              <li
                key={market}
                className="rounded-full border border-navy/10 bg-white/80 px-3 py-1.5 text-xs font-medium text-charcoal/75"
              >
                {market}
              </li>
            ))}
          </ul>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={40}>
        <section className="pb-14 md:pb-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="section-title text-center">Common questions</h2>
            <dl className="mt-8 space-y-6">
              {MINI_FAQ.map((item) => (
                <div key={item.question} className="rounded-2xl border border-navy/[0.08] bg-white p-5 shadow-sm">
                  <dt className="font-semibold text-navy">{item.question}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-charcoal/75">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </ScrollReveal>

      <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-charcoal to-navy-deep px-4 py-14 text-center text-cream shadow-luxury sm:px-8 md:rounded-3xl md:py-16">
        <div className="hero-grain absolute inset-0 opacity-15" aria-hidden />
        <div className="relative">
          <h2 className="section-title text-cream">Ready for a quote?</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-silver/90 md:text-base">
            Send photos and your address — {SITE_NAME} replies with scope and pricing, no obligation.
          </p>
          <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Link href={QUOTE_PATH} className="btn-hero-primary min-h-[48px]">
              Get a free quote
            </Link>
            <a href={PHONE_TEL} className="btn-hero-secondary min-h-[48px]">
              Call {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
