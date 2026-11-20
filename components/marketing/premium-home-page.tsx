import { FaqJsonLd } from "@/components/json-ld";
import { HomeStory } from "@/components/site/home-story";
import {
  ClosingCta,
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
      {/* The Dive: five-chapter scroll story (holds the H1), then the drag-to-spin car */}
      <HomeStory />
      <Intro />
      <ServicesShowcase />
      <PrivateClientSection />
      <HowItWorksSection />
      <TrustSection />
      <ServiceAreaSection />
      <FaqSection />
      <ClosingCta />
    </>
  );
}
