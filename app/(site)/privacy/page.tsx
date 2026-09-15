import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
import { getSiteHeroFallback } from "@/lib/marketing/service-images";
import { QUOTE_PATH } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Palm Beach Property Pros handles information submitted through this website and our quote forms.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-cream">
      <MarketingPageHero
        eyebrow="Legal"
        title="Privacy policy"
        lead="How we handle information you submit through our website and quote forms."
        image={getSiteHeroFallback()}
      />

      <article className="mx-auto max-w-3xl px-2 pb-16 md:pb-24">
        <div className="space-y-8 rounded-2xl border border-navy/[0.08] bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm leading-relaxed text-charcoal/90 sm:text-base">
            {new Date().getFullYear()} — Palm Beach Property Pros (&ldquo;we,&rdquo; &ldquo;us&rdquo;)
            respects your privacy. This policy describes how information you provide through this
            website may be used to respond to service requests.
          </p>

          <section>
            <h2 className="text-lg font-bold text-navy">Information you submit</h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/90 sm:text-base">
              When you contact us—through site pages or our quote forms—you may provide your name,
              phone number, email address, property address or city, service interests, and photos.
              We use that information solely to estimate scope, schedule work, and communicate about
              your project.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy">Sharing</h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/90 sm:text-base">
              We do not sell your personal information. We may share details with crew members or
              subcontractors only as needed to perform requested services. We may use email or SMS
              providers to send confirmations and updates related to your request.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy">Retention</h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/90 sm:text-base">
              We retain quote and job records as needed for scheduling, billing, and legal
              compliance. You may request deletion of marketing contact data by emailing us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy">Contact</h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/90 sm:text-base">
              Questions about this policy? Use our{" "}
              <Link href={QUOTE_PATH} className="font-semibold text-ocean no-underline hover:underline">
                quote form
              </Link>{" "}
              or call the number listed on our website.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
