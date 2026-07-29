import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { BeforeAfterCompare } from "@/components/media/before-after-compare";
import { FallbackHeroMedia } from "@/components/marketing/curated-hero-media";
import { CaseStudyPreview } from "@/components/marketing/case-study-preview";
import { CustomerPaths } from "@/components/marketing/customer-paths";
import { EstimateCta } from "@/components/marketing/estimate-cta";
import { HomeServiceCards } from "@/components/marketing/home-service-cards";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { RecurringPropertyCareSection } from "@/components/marketing/recurring-property-care-section";
import { ReviewsSection } from "@/components/marketing/reviews-section";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { ServiceAreaSection } from "@/components/marketing/service-area-section";
import { TrustBar } from "@/components/marketing/trust-bar";
import { getPublishedCaseStudies } from "@/lib/case-studies";
import { CTA } from "@/lib/cta";
import { FAQ_ITEMS } from "@/lib/faq";
import { HOME_SERVICE_CARDS } from "@/lib/homepage-services";
import type { HomepageMediaBundle } from "@/lib/media/homepage-media";
import { getSiteImage } from "@/lib/media/site-imagery";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "@/lib/site";

export function PremiumHomePage({ media }: { media: HomepageMediaBundle }) {
  const heroImage = getSiteImage("hero-home-exterior");
  const publishedCaseStudies = getPublishedCaseStudies();
  const featuredCaseStudy = publishedCaseStudies[0];

  /** Only authentic PBPP before/after — never stock in this section */
  const featuredTransformation =
    media.hasAuthenticMedia && media.transformations[0] ? media.transformations[0] : null;

  return (
    <>
      <section className="hero-cinematic animate-fade-up relative -mx-4 sm:-mx-6 md:mx-0 md:rounded-3xl">
        {heroImage ? (
          <FallbackHeroMedia
            src={heroImage.filePath}
            alt={heroImage.alt}
            objectPosition={heroImage.focal}
          />
        ) : null}

        <div className="relative z-10 px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-24 lg:py-28">
          <div className="max-w-xl md:max-w-3xl">
            <p className="section-eyebrow text-aqua/90 md:tracking-[0.32em]">
              Palm Beach County Property Care
            </p>
            <h1 className="hero-headline">
              One Reliable Team to Keep Your{" "}
              <span className="whitespace-nowrap">Palm Beach</span> Property Clean and Ready
            </h1>
            <p className="hero-lead">
              Window cleaning, pressure washing, recurring cleaning and dependable property care
              throughout Palm Beach County.
            </p>
          </div>

          <div className="mt-10 flex w-full max-w-xl flex-col gap-3 sm:max-w-none md:mt-12 md:max-w-3xl md:flex-row md:flex-wrap md:items-stretch md:gap-4">
            <Link href="/quote" className="btn-hero-primary min-h-[56px] w-full sm:w-auto md:min-w-[240px]">
              {CTA.primaryEstimate}
            </Link>
            <a
              href={PHONE_TEL}
              className="btn-hero-secondary min-h-[56px] w-full sm:w-auto md:min-w-[240px]"
            >
              <span className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-1.5">
                <span>{CTA.callOrText}</span>
                <span className="font-semibold tracking-wide">{PHONE_DISPLAY}</span>
              </span>
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
            <HomeServiceCards cards={HOME_SERVICE_CARDS} />
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
              <p className="section-eyebrow text-ocean">Palm Beach Property Pros project</p>
              <h2 className="section-title mt-4">Before &amp; after from a Palm Beach Gardens estate</h2>
              <p className="section-lead">
                Real project documentation from our crew—drag the slider to compare conditions
                before and after the work was completed.
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

      <ScrollReveal delay={50}>
        <section className="py-16 md:py-24">
          <RecurringPropertyCareSection />
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
          <div className="relative mx-auto mt-12 max-w-6xl">
            <HowItWorksSection />
          </div>
        </section>
      </ScrollReveal>

      {featuredCaseStudy ? (
        <ScrollReveal delay={80}>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-eyebrow text-ocean">Project results</p>
              <h2 className="section-title mt-4">Palm Beach Property Pros project</h2>
              <p className="section-lead mt-3 text-sm text-charcoal/65">
                Documented work from a completed Palm Beach County project.
              </p>
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
        withBackground
      />
    </>
  );
}
