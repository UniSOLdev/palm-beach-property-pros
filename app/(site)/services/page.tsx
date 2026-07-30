import type { Metadata } from "next";
import Link from "next/link";
import { ServiceListingCard } from "@/components/marketing/service-listing-card";
import { getPromotedServices } from "@/lib/services";
import { CTA } from "@/lib/cta";
import { QUOTE_PATH, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cleaning & Property Services",
  description: `${SITE_NAME} — window cleaning, pressure washing, residential and commercial cleaning, property care, and mobile detailing in Palm Beach County.`,
  alternates: { canonical: `${SITE_URL}/services` },
};

export default function ServicesPage() {
  const promotedServices = getPromotedServices();

  return (
    <div className="bg-cream">
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-ocean">Services</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-navy md:text-4xl">
            One local team for cleaning, property care, and mobile detailing
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/85">
            Browse services by property type, then request a free estimate. We serve homeowners,
            property managers, and businesses throughout Palm Beach County.
          </p>
          <div className="mt-8">
            <Link href={QUOTE_PATH} className="btn-primary">
              {CTA.primaryEstimate}
            </Link>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {promotedServices.map((s) => (
              <ServiceListingCard key={s.slug} service={s} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
