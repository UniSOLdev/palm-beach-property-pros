import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { TransformationCarousel, ProjectReelGrid } from "@/components/media/cinematic-project-media";
import { BeforeAfterGrid } from "@/components/media/before-after-grid";
import { DocumentationSuite } from "@/components/media/documentation-suite";
import { FeaturedProjectsSection } from "@/components/media/featured-projects-section";
import { FieldExecutionTimeline } from "@/components/media/field-execution-timeline";
import { MediaAssetImage } from "@/components/media/media-asset-image";
import { MediaFrame } from "@/components/media/media-frame";
import { StoryArcShowcase } from "@/components/media/story-arc-showcase";
import { TransformationShowcase } from "@/components/media/transformation-showcase";
import { CuratedHeroMedia, FallbackHeroMedia } from "@/components/marketing/curated-hero-media";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { FAQ_ITEMS } from "@/lib/faq";
import {
  FIELD_EXECUTION_STEPS,
  LOCAL_MARKETS,
  MEDIA_REGISTRY,
  OPERATIONAL_PROOF,
} from "@/lib/media";
import type { MediaAsset } from "@/lib/media/types";
import type { HomepageMediaBundle } from "@/lib/media/homepage-media";
import { buildMediaUrl } from "@/lib/media/resolve";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "@/lib/site";

const FALLBACK_HERO = MEDIA_REGISTRY.hero.primary;

const HERO_CHIPS = [
  "Licensed & insured",
  "Palm Beach County operations",
  "Documented field execution",
  "Estate & turnover programs",
] as const;

const CREDIBILITY_PILLARS = [
  {
    title: "Written scope first",
    body: "Access notes, substrates, and checkpoints confirmed before crews dispatch.",
  },
  {
    title: "County-native scheduling",
    body: "Salt exposure, humidity, and seasonal occupancy inform how programs run.",
  },
  {
    title: "Operational records",
    body: "Photo checklists, walkthrough notes, and visit logs when your asset requires them.",
  },
] as const;

const CARE_PLANS = [
  {
    eyebrow: "Weekly rhythm",
    title: "Weekly estate care",
    body: "High-touch residences and active storefronts on a steady operational baseline year-round.",
    icon: "calendar",
  },
  {
    eyebrow: "Seasonal playbook",
    title: "Seasonal property programs",
    body: "Open, close, and peak-season sequences for coastal estates and second homes.",
    icon: "palm",
  },
  {
    eyebrow: "Owner-offsite coverage",
    title: "Vacation home coordination",
    body: "Coordinated visits while you are away—glass, exterior, interior, and arrival readiness.",
    icon: "estate",
  },
  {
    eyebrow: "Per turnover",
    title: "Short-term rental turnovers",
    body: "Check-in aligned crews, linen resets, and staging details under your SOPs.",
    icon: "key",
  },
  {
    eyebrow: "Commercial cadence",
    title: "Storefront maintenance",
    body: "Glass, floors, and high-traffic zones matched to operating hours and foot traffic.",
    icon: "storefront",
  },
] as const;

const SERVICE_LINES = [
  {
    title: "Exterior care",
    body: "Curb presence, glass clarity, hardscape, and exterior surfaces maintained to coastal estate standards.",
    asset: MEDIA_REGISTRY.divisions.exterior,
    examples: ["Pressure washing", "Window lines", "Driveway refresh", "Pool deck care"],
    links: [
      { href: "/services/window-cleaning", label: "Window cleaning" },
      { href: "/services/pressure-washing", label: "Pressure washing" },
      { href: "/services/auto-detailing", label: "Exterior detailing" },
    ],
  },
  {
    title: "Interior care",
    body: "Estate resets, turnover prep, and interiors kept inspection-ready with repeatable crew standards.",
    asset: MEDIA_REGISTRY.divisions.interior,
    examples: ["Estate resets", "Move-out prep", "Kitchen detail", "Carpet care"],
    links: [
      { href: "/services/residential-cleaning", label: "Residential cleaning" },
      { href: "/services/carpet-steam-cleaning", label: "Carpet cleaning" },
      { href: "/services/residential-cleaning", label: "Move-out cleaning" },
    ],
  },
  {
    title: "Property support",
    body: "Turnovers, maintenance coordination, and onsite support aligned to operations calendars.",
    asset: MEDIA_REGISTRY.divisions.propertySupport,
    examples: ["Airbnb turnovers", "Vendor oversight", "Seasonal checks", "Trash services"],
    links: [
      { href: "/services/airbnb-services", label: "Airbnb turnovers" },
      { href: "/services/property-maintenance", label: "Property maintenance" },
      { href: "/services/trash-can-cleaning", label: "Trash services" },
    ],
  },
] as const;

const WHO_WE_SERVE = [
  "Estate homeowners",
  "Seasonal residents",
  "Property managers",
  "Airbnb operators",
  "Realtor partners",
  "Storefront operators",
  "HOA communities",
] as const;

function PlanIcon({ type }: { type: (typeof CARE_PLANS)[number]["icon"] }) {
  const shared = "h-5 w-5 text-aqua";
  switch (type) {
    case "calendar":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M6 5h12a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" />
        </svg>
      );
    case "palm":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M8 8c-2 2-4 5-4 8M16 8c2 2 4 5 4 8M5 12h14" />
        </svg>
      );
    case "estate":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V21H3v-10.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-6h6v6" />
        </svg>
      );
    case "key":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 7.5a4.5 4.5 0 11-6.4 6.4L5 18l-2 2 2-2 4.1-4.1A4.5 4.5 0 0115.5 7.5z" />
        </svg>
      );
    case "storefront":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16l-1 10H5L4 10zM4 10l2-6h12l2 6M9 14h6" />
        </svg>
      );
  }
}

export function PremiumHomePage({ media }: { media: HomepageMediaBundle }) {
  const useCuratedHero = media.hasAuthenticMedia && media.curatedHeroImage;
  const fallbackHeroSrc = buildMediaUrl(FALLBACK_HERO.src, 2000);

  const serviceLines: Array<(typeof SERVICE_LINES)[number] & { asset: MediaAsset }> = media.hasAuthenticMedia
    ? SERVICE_LINES.map((line, index) => {
        const project = media.galleryProjects[index] ?? media.galleryProjects[0];
        const image = project?.gallery[0] ?? project?.heroCandidates[0] ?? project?.beforeAfter[0]?.after;
        if (!image) return line;
        return {
          ...line,
          asset: {
            id: image.id,
            category: line.asset.category,
            src: image.src,
            alt: image.alt,
            source: "authentic",
            focal: image.focal,
            blurDataURL: image.blurDataURL,
            aspect: "landscape",
            overlay: "card",
          },
        };
      })
    : [...SERVICE_LINES];

  const audienceAsset: MediaAsset =
    media.hasAuthenticMedia && media.galleryProjects[0]?.heroCandidates[0]
      ? {
          id: media.galleryProjects[0].heroCandidates[0].id,
          category: "local",
          src: media.galleryProjects[0].heroCandidates[0].src,
          alt: media.galleryProjects[0].heroCandidates[0].alt,
          source: "authentic",
          focal: media.galleryProjects[0].heroCandidates[0].focal,
          blurDataURL: media.galleryProjects[0].heroCandidates[0].blurDataURL,
          aspect: "landscape",
          overlay: "subtle",
        }
      : MEDIA_REGISTRY.audience;

  const workflowAsset: MediaAsset =
    media.hasAuthenticMedia && media.galleryProjects[0]?.detailShots[0]
      ? {
          id: media.galleryProjects[0].detailShots[0].id,
          category: "exterior",
          src: media.galleryProjects[0].detailShots[0].src,
          alt: media.galleryProjects[0].detailShots[0].alt,
          source: "authentic",
          focal: media.galleryProjects[0].detailShots[0].focal,
          blurDataURL: media.galleryProjects[0].detailShots[0].blurDataURL,
          aspect: "portrait",
          overlay: "card",
        }
      : MEDIA_REGISTRY.operations.poolDeck;

  return (
    <>
      <section className="hero-cinematic animate-fade-up relative -mx-4 sm:-mx-6 md:mx-0 md:rounded-3xl">
        {useCuratedHero ? (
          <CuratedHeroMedia heroImage={media.curatedHeroImage} />
        ) : (
          <FallbackHeroMedia src={fallbackHeroSrc} alt={FALLBACK_HERO.alt} />
        )}

        <div className="relative z-10 px-4 py-20 sm:px-6 sm:py-24 md:px-10 md:py-32 lg:py-36">
          <div className="max-w-xl md:max-w-3xl">
            <p className="section-eyebrow text-aqua/90 md:tracking-[0.32em]">
              Palm Beach Property Operations
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-cream drop-shadow-[0_2px_24px_rgba(8,26,46,0.45)] sm:text-5xl md:mt-7 md:text-[3.25rem] md:leading-[1.06]">
              Property operations for Palm Beach County estates
            </h1>
            <p className="mt-7 max-w-xl text-base leading-[1.75] text-silver/95 sm:text-lg md:mt-9 md:max-w-2xl md:text-xl md:leading-[1.7]">
              Recurring estate support, turnovers, and field programs—coordinated with professional crews,
              documented execution, and modern client systems.
            </p>
          </div>

          <ul className="mt-10 flex flex-wrap justify-center gap-2.5 md:mt-12 md:justify-start md:gap-3">
            {HERO_CHIPS.map((chip) => (
              <li key={chip} className="luxury-pill">
                {chip}
              </li>
            ))}
          </ul>

          <div className="mt-12 flex w-full max-w-xl flex-col gap-3 sm:max-w-none md:mt-14 md:max-w-3xl md:flex-row md:flex-wrap md:items-center md:gap-4">
            <Link href="/quote" className="btn-hero-primary min-h-[56px] w-full sm:w-auto">
              Request a scope review
            </Link>
            <a href={PHONE_TEL} className="btn-hero-secondary min-h-[56px] w-full sm:w-auto">
              Call or Text {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <TransformationShowcase projects={media.transformations} isAuthentic={media.hasAuthenticMedia} />

      {media.hasAuthenticMedia && media.featuredPairs.length > 0 ? (
        <section className="pb-16 md:pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-ocean">Before &amp; after gallery</p>
            <h2 className="section-title mt-4">Every angle documented</h2>
            <p className="section-lead">
              Four paired comparisons from the Palm Beach Gardens estate cleanup—overgrown conditions
              beside restored pathways and exterior lines.
            </p>
          </div>
          <div className="mt-12">
            <BeforeAfterGrid pairs={media.featuredPairs} />
          </div>
        </section>
      ) : null}

      <div className="section-divider my-2 md:my-4" aria-hidden />

      <ScrollReveal>
        <section className="section-band-light relative overflow-hidden">
          <div className="absolute inset-0 bg-luxury-mesh opacity-60" aria-hidden />
          <div className="relative mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-ocean">Client platform</p>
            <h2 className="section-title">One secure operations portal</h2>
            <p className="section-lead">
              Quotes, scheduling, invoices, payment, and approvals stay on {SITE_NAME}—so nothing gets
              lost between field crews, owners, and property stakeholders.
            </p>
            <Link href="/quote" className="btn-primary mx-auto mt-8 inline-flex">
              Request a scope review
            </Link>
          </div>
        </section>
      </ScrollReveal>

      {media.storyArc ? <StoryArcShowcase storyArc={media.storyArc} /> : null}

      {media.hasAuthenticMedia && media.reelClips.length > 0 ? (
        <ScrollReveal delay={20}>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-eyebrow text-ocean">Field documentation</p>
              <h2 className="section-title mt-4">On-site video</h2>
              <p className="section-lead">
                Operational clips from the estate cleanup—crews clearing vegetation and restoring
                exterior lines in Palm Beach Gardens.
              </p>
            </div>
            <div className="mt-12">
              <ProjectReelGrid clips={media.reelClips.slice(0, 3)} />
            </div>
          </section>
        </ScrollReveal>
      ) : null}

      {media.hasAuthenticMedia && media.featuredPairs.length > 1 ? (
        <ScrollReveal delay={40}>
          <section className="pb-16 md:pb-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-eyebrow text-ocean">Interactive proof</p>
              <h2 className="section-title mt-4">Swipe through transformations</h2>
            </div>
            <div className="mt-10">
              <TransformationCarousel pairs={media.featuredPairs} />
            </div>
          </section>
        </ScrollReveal>
      ) : null}

      <ScrollReveal delay={60}>
        <section className="relative py-16 md:py-24">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aqua/15 to-transparent" aria-hidden />
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-ocean">Recurring programs</p>
            <h2 className="section-title mt-4">Estate maintenance cadence</h2>
            <p className="section-lead">
              Predictable visits, documented scope, and crews aligned to how your property actually
              runs—concierge-level coordination, not generic recurring visits.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {CARE_PLANS.map((plan) => (
              <article key={plan.title} className="care-plan-card group flex flex-col">
                <div className="care-plan-icon-wrap">
                  <PlanIcon type={plan.icon} />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-aqua-muted">
                  {plan.eyebrow}
                </p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-navy">{plan.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-charcoal/75">{plan.body}</p>
                <Link href="/quote" className="link-luxury mt-6 inline-block">
                  Discuss a program
                </Link>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={120}>
        <section className="section-band-warm relative overflow-hidden">
          <div className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-aqua/[0.04] blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-ocean">Service divisions</p>
            <h2 className="section-title mt-4">Operational service lines</h2>
            <p className="section-lead">
              Exterior, interior, and property support—structured the way mature field operators run
              county-wide programs.
            </p>
          </div>
          <div className="relative mt-14 grid gap-10 md:gap-12 lg:grid-cols-3">
            {serviceLines.map((line) => (
              <div key={line.title} className="service-division group flex flex-col">
                <MediaFrame aspect="landscape" className="service-division-image image-frame mb-8 rounded-2xl md:rounded-3xl">
                  <MediaAssetImage asset={line.asset} width={900} hoverScale={!media.hasAuthenticMedia} />
                  <div className="absolute bottom-0 left-0 right-0 z-[3] p-5">
                    <span className="inline-flex rounded-full border border-white/20 bg-navy-deep/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cream/90 backdrop-blur-md">
                      {line.title}
                    </span>
                  </div>
                </MediaFrame>
                <p className="max-w-sm text-sm leading-relaxed text-charcoal/70">{line.body}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {line.examples.map((example) => (
                    <li
                      key={example}
                      className="rounded-full border border-navy/[0.06] bg-white/70 px-2.5 py-1 text-[11px] font-medium text-charcoal/60"
                    >
                      {example}
                    </li>
                  ))}
                </ul>
                <ul className="mt-6 space-y-3">
                  {line.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="service-link-card group/link">
                        <span>{link.label}</span>
                        <span className="text-aqua-muted transition duration-500 group-hover/link:translate-x-0.5">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <FeaturedProjectsSection projects={media.recaps} />

      <ScrollReveal>
        <section className="py-16 md:py-24">
          <div className="grid min-w-0 gap-10 md:gap-14 lg:grid-cols-2 lg:items-center">
            <MediaFrame aspect="landscape" className="image-frame min-h-[220px] sm:min-h-[280px] md:min-h-0">
              <MediaAssetImage asset={audienceAsset} width={1200} hoverScale={!media.hasAuthenticMedia} />
            </MediaFrame>
            <div className="lg:pl-4">
              <p className="section-eyebrow text-ocean">Who we serve</p>
              <h2 className="section-title mt-3">Built for Palm Beach stakeholders</h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-charcoal/75">
                From estate driveways to dealership glass lines—one operations mindset: quiet execution,
                written scope, and repeatable field standards.
              </p>
              <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                {WHO_WE_SERVE.map((label) => (
                  <li key={label} className="audience-chip">
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <section className="trust-band relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-navy via-navy to-navy-deep py-14 text-cream shadow-luxury md:rounded-3xl md:py-16">
          <div className="absolute inset-0 bg-luxury-radial opacity-60" aria-hidden />
          <div className="hero-grain absolute inset-0 opacity-20" aria-hidden />
          <div className="relative">
            <div className="mx-auto max-w-2xl px-2 text-center">
              <p className="section-eyebrow text-aqua/80">Operational credibility</p>
              <h2 className="section-title mt-3 text-cream">How mature field programs run</h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-cream/80 md:text-base">
                No inflated claims—just the execution standards owners and managers expect from a
                county-embedded property operations partner.
              </p>
            </div>
            <ul className="mx-auto mt-10 grid max-w-4xl gap-5 px-2 md:grid-cols-3">
              {CREDIBILITY_PILLARS.map((pillar) => (
                <li key={pillar.title} className="credibility-pillar">
                  <h3 className="text-sm font-semibold text-cream">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-silver/80">{pillar.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-navy via-navy to-navy-deep py-16 text-cream shadow-luxury md:rounded-3xl md:py-20">
          <div className="absolute inset-0 bg-luxury-radial opacity-60" aria-hidden />
          <div className="hero-grain absolute inset-0 opacity-20" aria-hidden />
          <div className="relative mx-auto max-w-3xl px-2 text-center">
            <p className="section-eyebrow text-aqua/80">Local presence</p>
            <h2 className="section-title text-cream">Embedded in Palm Beach County</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream/85 md:text-lg">
              {SITE_NAME} coordinates programs throughout the county—where coastal humidity, salt exposure,
              and seasonal occupancy patterns inform how we schedule exterior refreshes, interior care, and
              turnovers.
            </p>
            <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
              {LOCAL_MARKETS.map((market) => (
                <li
                  key={market}
                  className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-cream/85 backdrop-blur-sm"
                >
                  {market}
                </li>
              ))}
            </ul>
            <Link
              href="/service-area"
              className="mt-8 inline-block text-sm font-semibold tracking-wide text-aqua no-underline transition duration-500 hover:text-cream"
            >
              View full service area →
            </Link>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={60}>
        <section className="py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:items-start lg:gap-14">
            <div>
              <p className="section-eyebrow text-ocean">Field workflow</p>
              <h2 className="section-title mt-3">From scope to documented completion</h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-charcoal/70 md:text-base">
                A clear operational path from first contact to completed scope—no ambiguity for owners,
                managers, or seasonal stakeholders.
              </p>
              <div className="mt-10">
                <FieldExecutionTimeline steps={FIELD_EXECUTION_STEPS} />
              </div>
            </div>
            <MediaFrame aspect="portrait" className="image-frame hidden min-h-[320px] lg:block">
              <MediaAssetImage asset={workflowAsset} width={600} hoverScale={!media.hasAuthenticMedia} />
            </MediaFrame>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="section-band-muted relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0 bg-luxury-mesh opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-3xl">
            <p className="section-eyebrow text-ocean">Documentation systems</p>
            <h2 className="section-title mt-3">Owner visibility &amp; operational records</h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-charcoal/75">
              Walkthrough notes, photo checklists, property logs, and written scopes—structured for owners
              and managers who expect vendor accountability.
            </p>
            <div className="mt-10">
              <DocumentationSuite items={OPERATIONAL_PROOF} />
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={40}>
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-3xl">
            <h2 className="section-title">FAQ</h2>
            <p className="mt-4 text-sm text-charcoal/65">
              Common questions from property owners, managers, and seasonal residents.
            </p>
            <div className="mt-10">
              <FaqAccordion items={FAQ_ITEMS} />
            </div>
          </div>
        </section>
      </ScrollReveal>

      <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-charcoal to-navy-deep px-4 py-16 text-center text-cream shadow-luxury sm:px-8 md:rounded-3xl md:py-20">
        <div className="absolute inset-0 bg-luxury-vignette opacity-70" aria-hidden />
        <div className="hero-grain absolute inset-0 opacity-15" aria-hidden />
        <div className="hero-glow absolute inset-0 opacity-40" aria-hidden />
        <div className="relative">
          <h2 className="section-title text-cream">Ready when you are</h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-silver/90">
            Same team for scope review, field execution, invoicing, and ongoing programs—organized the way
            modern property operations should be.
          </p>
          <div className="mx-auto mt-10 flex w-full max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center md:gap-4">
            <Link href="/quote" className="btn-hero-primary min-h-[52px] w-full sm:w-auto">
              Request a scope review
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
