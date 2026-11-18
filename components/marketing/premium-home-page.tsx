import { FaqJsonLd } from "@/components/json-ld";
import { ScrollHero } from "@/components/site/scroll-hero";
import { SequenceHero, heroMode } from "@/components/site/sequence-hero";
import {
  ClosingCta,
  DetailingFeature,
  FaqSection,
  HowItWorksSection,
  Intro,
  PrivateClientSection,
  ServiceAreaSection,
  ServicesShowcase,
  TrustSection,
} from "@/components/site/sections";

/** Public homepage (locked: not CMS-driven — see scripts/verify-public-homepage-lock.mjs). */
export function PremiumHomePage() {
  return (
    <>
      <FaqJsonLd />
      {heroMode === "sequence" ? <SequenceHero /> : <ScrollHero />}
      <Intro />
      <ServicesShowcase />
      <DetailingFeature />
      <PrivateClientSection />
      <HowItWorksSection />
      <TrustSection />
      <ServiceAreaSection />
      <FaqSection />
      <ClosingCta />
    </>
  );
}
