import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { BeforeAfterCompare } from "@/components/media/before-after-compare";
import { CuratedHeroMedia, FallbackHeroMedia } from "@/components/marketing/curated-hero-media";
import { CaseStudyPreview } from "@/components/marketing/case-study-preview";
import { CustomerPaths } from "@/components/marketing/customer-paths";
import { EstimateCta } from "@/components/marketing/estimate-cta";
import { HomeServiceCards } from "@/components/marketing/home-service-cards";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { ReviewsSection } from "@/components/marketing/reviews-section";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { ServiceAreaSection } from "@/components/marketing/service-area-section";
import { TrustBar } from "@/components/marketing/trust-bar";
import { getPublishedCaseStudies } from "@/lib/case-studies";
import { CTA } from "@/lib/cta";
import { FAQ_ITEMS } from "@/lib/faq";
import { HOME_SERVICE_CARDS } from "@/lib/homepage-services";
import { MEDIA_REGISTRY } from "@/lib/media";
import type { HomepageMediaBundle } from "@/lib/media/homepage-media";
import type { MediaAsset } from "@/lib/media/types";
import { buildMediaUrl } from "@/lib/media/resolve";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "@/lib/site";

const FALLBACK_HERO = MEDIA_REGISTRY.hero.primary;

export function PremiumHomePage({ media }: { media: HomepageMediaBundle }) {
  const useCuratedHero = media.hasAuthenticMedia && media.curatedHeroImage;
  const fallbackHeroSrc = buildMediaUrl(FALLBACK_HERO.src, 2000);
  const publishedCaseStudies = getPublishedCaseStudies();
  const featuredCaseStudy = publishedCaseStudies[0];

  const serviceCards = HOME_SERVICE_CARDS.map((card, index) => {
    if (!media.hasAuthenticMedia) return card;
    const project = media.galleryProjects[index % media.galleryProjects.length];
    const image = project?.gallery[0] ?? project?.heroCandidates[0] ?? project?.beforeAfter[0]?.after;
    if (!image) return card;
    return {
      ...card,
      asset: {
        id: image.id,
        category: card.asset.category,
        src: image.src,
        alt: image.alt,
        source: "authentic" as const,
        focal: image.focal,
        blurDataURL: image.blurDataURL,
        aspect: "landscape" as const,
        overlay: "card" as const,
      },
    };
  });

  const featuredTransformation =
    media.hasAuthenticMedia && media.transformations[0] ? media.transformations[0] : null;

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
              Palm Beach County Property Care
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-cream drop-shadow-[0_2px_24px_rgba(8,26,46,0.45)] sm:text-5xl md:mt-7 md:text-[3.25rem] md:leading-[1.06]">
              One Reliable Team to Keep Your Palm Beach Property Clean, Maintained and Ready
            </h1>
            <p className="mt-7 max-w-xl text-base leading-[1.75] text-silver/95 sm:text-lg md:mt-9 md:max-w-2xl md:text-xl md:leading-[1.7]">
              Window cleaning, pressure washing, property cleanups, recurring cleaning and dependable
              property care throughout Palm Beach County.
            </p>
          </div>

          <div className="mt-12 flex w-full max-w-xl flex-col gap-3 sm:max-w-none md:mt-14 md:max-w-3xl md:flex-row md:flex-wrap md:items-center md:gap-4">
            <Link href="/quote" className="btn-hero-primary min-h-[56px] w-full sm:w-auto">
              {CTA.primaryEstimate}
            </Link>
            <a href={PHONE_TEL} className="btn-hero-secondary min-h-[56px] w-full sm:w-auto">
              {CTA.callOrText} {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <TrustBar />

      <ScrollReveal>
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-ocean">Our services</p>
            <h2 className="section-title mt-4">Cleaning and property care—one local team</h2>
            <p className="section-lead">
              From window lines and pressure washing to recurring home cleaning, commercial care, and
              estate support—{SITE_NAME} handles the work that keeps your property presentable.
            </p>
          </div>
          <div className="mt-12">
            <HomeServiceCards cards={serviceCards} />
          </div>
          <p className="mt-8 text-center">
            <Link href="/services" className="link-luxury text-sm">
              {CTA.viewServices} →
            </Link>
          </p>
        </section>
      </ScrollReveal>

      <ReviewsSection />

      {featuredTransformation ? (
        <ScrollReveal delay={20}>
          <section className="section-band-light relative overflow-hidden py-16 md:py-24">
            <div className="absolute inset-0 bg-luxury-mesh opacity-60" aria-hidden />
            <div className="relative mx-auto max-w-2xl text-center">
              <p className="section-eyebrow text-ocean">Before &amp; after</p>
              <h2 className="section-title mt-4">Real results from Palm Beach County projects</h2>
              <p className="section-lead">
                Drag the slider to compare conditions before and after our crew completed the work.
              </p>
            </div>
            <div className="relative mx-auto mt-12 max-w-4xl">
              <BeforeAfterCompare project={featuredTransformation} />
            </div>
          </section>
        </ScrollReveal>
      ) : null}

      <ScrollReveal delay={40}>
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-ocean">Who we help</p>
            <h2 className="section-title mt-4">Clear paths for every type of customer</h2>
            <p className="section-lead">
              Whether you own a home, manage rentals, or run a commercial space—we make it easy to
              request an estimate and get dependable service.
            </p>
          </div>
          <div className="mt-12">
            <CustomerPaths />
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={60}>
        <section className="section-band-muted relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0 bg-luxury-mesh opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-ocean">How it works</p>
            <h2 className="section-title mt-4">Simple from estimate to finished work</h2>
            <p className="section-lead">
              No complicated process—just clear communication, reliable scheduling, and documented
              results.
            </p>
          </div>
          <div className="relative mt-12">
            <HowItWorksSection />
          </div>
        </section>
      </ScrollReveal>

      {featuredCaseStudy ? (
        <ScrollReveal delay={80}>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-eyebrow text-ocean">Project results</p>
              <h2 className="section-title mt-4">Selected work from the field</h2>
            </div>
            <div className="mt-10">
              <CaseStudyPreview study={featuredCaseStudy} />
            </div>
          </section>
        </ScrollReveal>
      ) : null}

      <ScrollReveal>
        <ServiceAreaSection />
      </ScrollReveal>

      <ScrollReveal delay={40}>
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-3xl">
            <h2 className="section-title">Frequently asked questions</h2>
            <p className="mt-4 text-sm text-charcoal/65">
              Common questions from homeowners, property managers, and seasonal residents.
            </p>
            <div className="mt-10">
              <FaqAccordion items={FAQ_ITEMS} />
            </div>
          </div>
        </section>
      </ScrollReveal>

      <EstimateCta
        title="Ready when you are"
        body="Share photos and property details—we will call or text you to confirm scope and next steps."
      />
    </>
  );
}
