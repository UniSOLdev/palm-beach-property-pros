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
    <section className="relative py-16 md:py-24">
      <ScrollReveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow text-ocean">What we do</p>
          <h2 className="section-title mt-4">Five ways we keep properties ready</h2>
          <p className="section-lead">
            Yard care, glass, turnovers, debris removal, and detailing — one local crew, documented
            results, Palm Beach County.
          </p>
        </div>
      </ScrollReveal>

      <ScrollRevealStagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
        {CORE_SERVICES.map((service, index) => (
          <ScrollRevealItem key={service.slug}>
            <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.08] bg-white p-5 shadow-md transition duration-500 hover:-translate-y-1 hover:shadow-luxury md:p-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-aqua-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-navy">{service.name}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal/75">{service.tagline}</p>
              <ul className="mt-4 space-y-1.5">
                {service.examples.map((ex) => (
                  <li key={ex} className="text-[11px] font-medium text-charcoal/55">
                    · {ex}
                  </li>
                ))}
              </ul>
              <Link
                href={`/services/${service.slug}`}
                className="link-luxury mt-6 inline-block text-sm font-semibold"
              >
                Learn more
              </Link>
            </article>
          </ScrollRevealItem>
        ))}
      </ScrollRevealStagger>

      <ScrollReveal delay={120}>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={QUOTE_PATH} className="btn-primary min-h-[48px] px-8">
            Get a free quote
          </Link>
          <Link href="/services" className="btn-secondary min-h-[48px] border-ocean/30 px-8">
            All services
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
