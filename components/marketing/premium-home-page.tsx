import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { BeforeAfterGrid } from "@/components/media/before-after-grid";
import { FeaturedProjectsSection } from "@/components/media/featured-projects-section";
import { FieldExecutionTimeline } from "@/components/media/field-execution-timeline";
import { TransformationShowcase } from "@/components/media/transformation-showcase";
import { CmsFeaturedProjectsSection } from "@/components/marketing/cms-featured-projects-section";
import { FeaturedServicesSection } from "@/components/marketing/featured-services-section";
import { CuratedHeroMedia, FallbackHeroMedia } from "@/components/marketing/curated-hero-media";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { FAQ_ITEMS } from "@/lib/faq";
import { FIELD_EXECUTION_STEPS, LOCAL_MARKETS, MEDIA_REGISTRY } from "@/lib/media";
import type { HomepageMediaBundle } from "@/lib/media/homepage-media";
import type { SiteHomepageSettings, SiteProject, SiteService, SiteTestimonial } from "@/lib/site-content/types";
import { buildMediaUrl } from "@/lib/media/resolve";
import { PHONE_DISPLAY, PHONE_TEL, QUOTE_PATH, SITE_NAME } from "@/lib/site";

const FALLBACK_HERO = MEDIA_REGISTRY.hero.primary;
const HOMEPAGE_FAQ = FAQ_ITEMS.slice(0, 4);

const HERO_CHIPS = [
  "Licensed & insured",
  "Palm Beach County",
  "Photo-backed scope",
  "Free estimates",
] as const;

const CREDIBILITY_PILLARS = [
  {
    title: "Written scope first",
    body: "Access, substrates, and checkpoints confirmed before crews dispatch.",
  },
  {
    title: "County-native scheduling",
    body: "Salt, humidity, and seasonal occupancy inform how programs run.",
  },
  {
    title: "Documented field work",
    body: "Photo checklists and visit records when your property requires them.",
  },
] as const;

const WHO_WE_SERVE = [
  "Estate homeowners",
  "Seasonal residents",
  "Property managers",
  "Airbnb operators",
  "Storefront operators",
] as const;

export function PremiumHomePage({
  media,
  homepage,
  featuredServices = [],
  featuredProjects = [],
  testimonials = [],
  useDbProjects = false,
}: {
  media: HomepageMediaBundle;
  homepage?: SiteHomepageSettings;
  featuredServices?: SiteService[];
  featuredProjects?: SiteProject[];
  testimonials?: SiteTestimonial[];
  useDbProjects?: boolean;
}) {
  const useCuratedHero = !useDbProjects && media.hasAuthenticMedia && media.curatedHeroImage;
  const fallbackHeroSrc = media.heroImageSrc || buildMediaUrl(FALLBACK_HERO.src, 2000);
  const fallbackHeroAlt = media.heroImageAlt || FALLBACK_HERO.alt;

  const heroEyebrow = homepage?.hero_eyebrow ?? "Palm Beach Property Pros";
  const heroHeadline =
    homepage?.hero_headline ?? "Professional Cleaning & Property Care in Palm Beach County";
  const heroSubheadline =
    homepage?.hero_subheadline ??
    "Window detailing, pressure washing, estate cleanups, and ongoing property care—clear communication and photo-backed scope.";
  const heroPrimaryCta = homepage?.hero_primary_cta_label ?? "Request a Free Estimate";
  const heroSecondaryCta = homepage?.hero_secondary_cta_label ?? "Call or Text";
  const trustMicrocopy =
    homepage?.trust_microcopy ?? "Free estimates • Photo uploads • Clear communication";
  const heroChips =
    homepage?.trust_statements?.length ? homepage.trust_statements.slice(0, 4) : [...HERO_CHIPS];
  const showFeaturedServices = homepage?.section_visibility?.featured_services !== false;
  const showFeaturedProjects = homepage?.section_visibility?.featured_projects !== false;

  const closingHeadline = homepage?.closing_cta_headline ?? "Ready for a free estimate?";
  const closingBody =
    homepage?.closing_cta_body ??
    "Share your property details and photos—we respond with scope-based pricing and clear next steps.";
  const serviceAreaCopy =
    homepage?.service_area_content ??
    "Serving homeowners, estates, property managers, and commercial clients throughout Palm Beach County.";

  const pinnedProjects = featuredProjects.slice(0, 3);
  const recapProjects = media.recaps.slice(0, 3);
  const beforeAfterPairs = media.featuredPairs.slice(0, 4);
  const featuredTestimonials = testimonials.slice(0, 2);

  const showDbProjects = useDbProjects && showFeaturedProjects && pinnedProjects.length > 0;
  const showTransformation = !showDbProjects && media.transformations.length > 0;
  const showBeforeAfterGrid =
    !showDbProjects && !showTransformation && beforeAfterPairs.length > 0;
  const showRecaps = !showDbProjects && !showTransformation && !showBeforeAfterGrid && recapProjects.length > 0;

  return (
    <>
      {/* 1. Hero */}
      <section className="hero-cinematic animate-fade-up relative -mx-4 sm:-mx-6 md:mx-0 md:rounded-3xl">
        {useCuratedHero ? (
          <CuratedHeroMedia heroImage={media.curatedHeroImage} />
        ) : (
          <FallbackHeroMedia src={fallbackHeroSrc} alt={fallbackHeroAlt} />
        )}

        <div className="relative z-10 px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-28 lg:py-32">
          <div className="max-w-xl md:max-w-3xl">
            <p className="section-eyebrow text-aqua/90 md:tracking-[0.32em]">{heroEyebrow}</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-cream drop-shadow-[0_2px_24px_rgba(8,26,46,0.45)] sm:text-5xl md:mt-6 md:text-[3.1rem] md:leading-[1.06]">
              {heroHeadline}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-[1.7] text-silver/95 sm:text-lg md:max-w-2xl md:text-xl">
              {heroSubheadline}
            </p>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-2 md:justify-start md:gap-2.5">
            {heroChips.map((chip) => (
              <li key={chip} className="luxury-pill">
                {chip}
              </li>
            ))}
          </ul>

          <p className="mt-5 text-sm text-silver/90">{trustMicrocopy}</p>

          <div className="mt-7 flex w-full max-w-xl flex-col gap-3 sm:max-w-none md:max-w-3xl md:flex-row md:flex-wrap md:items-center md:gap-4">
            <Link href={QUOTE_PATH} className="btn-hero-primary min-h-[56px] w-full sm:w-auto">
              {heroPrimaryCta}
            </Link>
            <a href={PHONE_TEL} className="btn-hero-secondary min-h-[56px] w-full sm:w-auto">
              {heroSecondaryCta} {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      {/* 2. Core services */}
      {showFeaturedServices && featuredServices.length ? (
        <FeaturedServicesSection services={featuredServices} />
      ) : null}

      {/* 3. Project / before-and-after proof (one primary block) */}
      {showDbProjects ? (
        <CmsFeaturedProjectsSection projects={pinnedProjects} />
      ) : null}

      {showTransformation ? (
        <TransformationShowcase projects={media.transformations} isAuthentic={media.hasAuthenticMedia} />
      ) : null}

      {showBeforeAfterGrid ? (
        <section className="pb-14 md:pb-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-ocean">Before &amp; after</p>
            <h2 className="section-title mt-3">Documented field results</h2>
            <p className="section-lead">
              Real project contrast from Palm Beach County work—restored lines beside neglected conditions.
            </p>
          </div>
          <div className="mt-10">
            <BeforeAfterGrid pairs={beforeAfterPairs} />
          </div>
          <p className="mt-8 text-center">
            <Link href="/projects" className="text-sm font-semibold text-ocean hover:underline">
              View all projects →
            </Link>
          </p>
        </section>
      ) : null}

      {showRecaps ? (
        <>
          <FeaturedProjectsSection projects={recapProjects} />
          <p className="-mt-6 pb-10 text-center md:-mt-10">
            <Link href="/projects" className="text-sm font-semibold text-ocean hover:underline">
              View all projects →
            </Link>
          </p>
        </>
      ) : null}

      {/* 4. Why choose PBPP / trust */}
      <ScrollReveal>
        <section className="trust-band relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-navy via-navy to-navy-deep py-12 text-cream shadow-luxury md:rounded-3xl md:py-14">
          <div className="absolute inset-0 bg-luxury-radial opacity-60" aria-hidden />
          <div className="hero-grain absolute inset-0 opacity-20" aria-hidden />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-eyebrow text-aqua/80">Why {SITE_NAME}</p>
              <h2 className="section-title mt-3 text-cream">Quiet execution, written scope</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-cream/80 md:text-base">
                County-embedded crews for estates, seasonal homes, rentals, and storefronts—without inflated
                claims or vague pricing.
              </p>
            </div>
            <ul className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-3">
              {CREDIBILITY_PILLARS.map((pillar) => (
                <li key={pillar.title} className="credibility-pillar">
                  <h3 className="text-sm font-semibold text-cream">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-silver/80">{pillar.body}</p>
                </li>
              ))}
            </ul>
            <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
              {WHO_WE_SERVE.map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-cream/85"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </ScrollReveal>

      {featuredTestimonials.length ? (
        <ScrollReveal delay={40}>
          <section className="py-12 md:py-16">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <p className="section-eyebrow text-ocean">Client feedback</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {featuredTestimonials.map((item) => (
                  <blockquote
                    key={item.id}
                    className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm"
                  >
                    <p className="text-sm italic leading-relaxed text-charcoal/85">&ldquo;{item.quote}&rdquo;</p>
                    <footer className="mt-3 text-xs font-semibold text-navy">
                      — {item.author}
                      {item.location ? ` · ${item.location}` : ""}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      ) : null}

      {/* 5. Service area + process (compact) */}
      <ScrollReveal delay={60}>
        <section className="section-band-light py-12 md:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
              <div>
                <p className="section-eyebrow text-ocean">Service area</p>
                <h2 className="section-title mt-3">Palm Beach County</h2>
                <p className="mt-4 text-sm leading-relaxed text-charcoal/75 md:text-base">{serviceAreaCopy}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {LOCAL_MARKETS.slice(0, 6).map((market) => (
                    <li
                      key={market}
                      className="rounded-full border border-navy/10 bg-white px-3 py-1 text-xs font-medium text-charcoal/70"
                    >
                      {market}
                    </li>
                  ))}
                </ul>
                <Link href="/service-area" className="mt-5 inline-block text-sm font-semibold text-ocean hover:underline">
                  View full service area →
                </Link>
              </div>
              <div>
                <p className="section-eyebrow text-ocean">How it works</p>
                <h2 className="section-title mt-3">From estimate to completion</h2>
                <p className="mt-4 text-sm leading-relaxed text-charcoal/75">
                  Request scope, confirm access, execute with photo checkpoints, and receive clear invoicing.
                </p>
                <div className="mt-6">
                  <FieldExecutionTimeline steps={FIELD_EXECUTION_STEPS.slice(0, 4)} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Supporting FAQ (short — full detail on service pages) */}
      <ScrollReveal delay={80}>
        <section className="py-12 md:py-16">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <h2 className="section-title">Common questions</h2>
            <p className="mt-3 text-sm text-charcoal/65">
              Quick answers for property owners and managers. Service-specific FAQs live on each service page.
            </p>
            <div className="mt-8">
              <FaqAccordion items={HOMEPAGE_FAQ} />
            </div>
            <p className="mt-6 text-center">
              <Link href="/services" className="text-sm font-semibold text-ocean hover:underline">
                Browse services &amp; detailed FAQs →
              </Link>
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* 6. Final CTA */}
      <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-charcoal to-navy-deep px-4 py-14 text-center text-cream shadow-luxury sm:px-8 md:rounded-3xl md:py-16">
        <div className="absolute inset-0 bg-luxury-vignette opacity-70" aria-hidden />
        <div className="hero-grain absolute inset-0 opacity-15" aria-hidden />
        <div className="relative">
          <h2 className="section-title text-cream">{closingHeadline}</h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-silver/90">{closingBody}</p>
          <div className="mx-auto mt-8 flex w-full max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center md:gap-4">
            <Link href={QUOTE_PATH} className="btn-hero-primary min-h-[52px] w-full sm:w-auto">
              {heroPrimaryCta}
            </Link>
            <a href={PHONE_TEL} className="btn-hero-secondary min-h-[52px] w-full sm:w-auto">
              Call or Text {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
