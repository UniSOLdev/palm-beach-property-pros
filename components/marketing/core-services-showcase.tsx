"use client";

import Link from "next/link";
import { ServiceMediaCard } from "@/components/marketing/service-media-card";
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollRevealStagger,
} from "@/components/marketing/scroll-reveal";
import { CORE_SERVICES } from "@/lib/marketing/core-services";
import { getServiceImageAsset } from "@/lib/marketing/service-images";
import { QUOTE_PATH } from "@/lib/site";

export function CoreServicesShowcase() {
  return (
    <section className="relative py-14 md:py-20">
      <ScrollReveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow text-ocean">Services</p>
          <h2 className="section-title mt-3">Restore, clean, and maintain</h2>
          <p className="section-lead mt-4">
            Field crews for yards, glass, turnovers, and cleanouts — residential and commercial.
          </p>
        </div>
      </ScrollReveal>

      <ScrollRevealStagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {CORE_SERVICES.map((service) => (
          <ScrollRevealItem key={service.slug}>
            <ServiceMediaCard
              href={`/services/${service.slug}`}
              title={service.name}
              description={service.tagline}
              asset={getServiceImageAsset(service.slug)}
            />
          </ScrollRevealItem>
        ))}
      </ScrollRevealStagger>

      <ScrollReveal delay={80}>
        <div className="mt-8 text-center">
          <Link href={QUOTE_PATH} className="btn-primary min-h-[48px] px-8">
            Get a free quote
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
