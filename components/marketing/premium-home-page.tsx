import { FaqJsonLd } from "@/components/json-ld";
import { ScrollHero } from "@/components/site/scroll-hero";
import {
  FaqSection,
  HowItWorksSection,
  PromiseBand,
  QuoteSection,
  ServiceAreaSection,
  ServicesSection,
  TrustSection,
} from "@/components/site/sections";

/** Public homepage (locked: not CMS-driven — see scripts/verify-public-homepage-lock.mjs). */
export function PremiumHomePage() {
  return (
    <>
      <FaqJsonLd />
      <ScrollHero />
      <PromiseBand />
      <ServicesSection />
      <HowItWorksSection />
      <TrustSection />
      <ServiceAreaSection />
      <FaqSection />
      <QuoteSection />
    </>
  );
}
