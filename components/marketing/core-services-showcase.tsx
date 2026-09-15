"use client";

import Link from "next/link";
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollRevealStagger,
} from "@/components/marketing/scroll-reveal";
import { CORE_SERVICES } from "@/lib/marketing/core-services";
import { QUOTE_PATH } from "@/lib/site";

export function CoreServicesShowcase() {
  return (
    <section className="relative py-14 md:py-20">
      <ScrollReveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow text-ocean">Services</p>
          <h2 className="section-title mt-3">Restore, clean, and maintain</h2>
        </div>
      </ScrollReveal>

      <ScrollRevealStagger className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
        {CORE_SERVICES.map((service) => (
          <ScrollRevealItem key={service.slug}>
            <Link
              href={`/services/${service.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-navy/[0.08] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-luxury no-underline"
            >
              <h3 className="text-base font-semibold tracking-tight text-navy group-hover:text-ocean">
                {service.name}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-snug text-charcoal/70">{service.tagline}</p>
              <span className="mt-4 text-xs font-semibold text-ocean">Details →</span>
            </Link>
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
