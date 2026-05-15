import Image from "next/image";
import Link from "next/link";

import { FaqAccordion } from "@/components/faq-accordion";
import { FAQ_ITEMS } from "@/lib/faq";
import { PbppCtaLink } from "@/components/pbpp-cta-link";
import { SERVICE_DIVISIONS } from "@/lib/service-divisions";
import { SITE_NAME } from "@/lib/site";
import type { CmsCtaInline, CmsHomeSection, CmsThemePublished } from "@/lib/cms-types";
import { cityListComma } from "@/lib/cms-defaults";

function CtaLink({ cta, className }: { cta: CmsCtaInline; className?: string }) {
  return (
    <PbppCtaLink href={cta.href} external={cta.external} className={className}>
      {cta.label}
    </PbppCtaLink>
  );
}

function heroImageOpacity(theme: CmsThemePublished | null | undefined): number {
  const raw = theme?.hero_overlay_opacity;
  const n = typeof raw === "number" && Number.isFinite(raw) ? raw : 55;
  const pct = Math.min(95, Math.max(20, n));
  return pct / 100;
}

function interpolateLocalBody(template: string, cityList: string): string {
  return template.replaceAll("{siteName}", SITE_NAME).replaceAll("{cityList}", cityList);
}

export function CmsHomepageView({
  sections,
  theme,
}: {
  sections: CmsHomeSection[];
  theme?: CmsThemePublished | null;
}) {
  const overlay = heroImageOpacity(theme);

  return (
    <>
      {sections.map((section) => {
        if (!section.visible) return null;
        switch (section.type) {
          case "hero": {
            const d = section.data;
            return (
              <section
                key={section.id}
                className="relative -mx-6 overflow-hidden rounded-none bg-charcoal md:mx-0 md:rounded-3xl"
              >
                <div className="absolute inset-0">
                  <Image
                    src={d.heroImageUrl}
                    alt=""
                    fill
                    priority
                    className="object-cover"
                    style={{ opacity: overlay }}
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/30" />
                </div>
                <div className="relative px-6 py-20 sm:py-28">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-aqua/90">{d.brandEssence}</p>
                  <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-cream sm:text-5xl sm:leading-[1.08]">
                    {d.headline}
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-silver/95 sm:text-xl">{d.subheadline}</p>
                  <ul className="mt-8 flex flex-wrap gap-2">
                    {d.trustPills.map((t) => (
                      <li
                        key={t}
                        className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-cream/95 backdrop-blur-md"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <CtaLink cta={d.primaryCta} className="btn-primary-lg text-center" />
                    <CtaLink cta={d.secondaryCta} className="btn-secondary-lg text-center" />
                  </div>
                </div>
              </section>
            );
          }
          case "portal_strip": {
            const d = section.data;
            return (
              <section key={section.id} className="animate-fade-up border-y border-navy/10 bg-white/60 py-10 backdrop-blur-sm">
                <div className="mx-auto flex max-w-4xl flex-col gap-4 text-center">
                  <h2 className="text-lg font-semibold tracking-tight text-navy">{d.title}</h2>
                  <p className="text-sm leading-relaxed text-charcoal/85 sm:text-base">{d.body}</p>
                  <CtaLink cta={d.cta} className="btn-primary mx-auto mt-2" />
                </div>
              </section>
            );
          }
          case "property_care_plans": {
            const d = section.data;
            return (
              <section key={section.id} className="animate-fade-up py-20">
                <div className="mx-auto max-w-2xl text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean">{d.sectionEyebrow}</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">{d.title}</h2>
                  <p className="mt-4 text-charcoal/80">{d.subtitle}</p>
                </div>
                <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {d.plans.map((p) => (
                    <article
                      key={p.name}
                      className="group glass-panel img-zoom flex flex-col p-6 transition duration-500 hover:border-aqua/30 hover:shadow-glow"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-aqua/90">{p.cadence}</p>
                      <h3 className="mt-2 text-lg font-semibold text-navy">{p.name}</h3>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal/85">{p.description}</p>
                      <CtaLink
                        cta={p.cta}
                        className="mt-5 text-sm font-semibold text-ocean no-underline hover:underline"
                      />
                    </article>
                  ))}
                </div>
              </section>
            );
          }
          case "service_divisions": {
            const d = section.data;
            return (
              <section
                key={section.id}
                className="animate-fade-up rounded-3xl border border-navy/10 bg-gradient-to-b from-white to-cream/80 py-20 shadow-card"
              >
                <div className="mx-auto max-w-2xl text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean">{d.sectionEyebrow}</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">{d.title}</h2>
                  <p className="mt-4 text-charcoal/80">{d.subtitle}</p>
                </div>
                <div className="mt-14 grid gap-10 lg:grid-cols-3">
                  {SERVICE_DIVISIONS.map((div) => (
                    <div key={div.id} className="flex flex-col">
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-graphite/80">{div.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{div.subtitle}</p>
                      <ul className="mt-6 space-y-3">
                        {div.services.map((s) => (
                          <li key={`${div.id}-${s.slug}-${s.label}`}>
                            <Link
                              href={`/services/${s.slug}`}
                              className="group flex items-center justify-between rounded-xl border border-navy/10 bg-white/80 px-4 py-3 text-sm font-medium text-navy shadow-sm no-underline transition hover:border-aqua/40 hover:shadow-md"
                            >
                              <span>{s.label}</span>
                              <span className="text-ocean transition group-hover:translate-x-0.5">→</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            );
          }
          case "who_we_work_with": {
            const d = section.data;
            return (
              <section key={section.id} className="animate-fade-up py-20">
                <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                  <div className="img-zoom group relative min-h-[280px] overflow-hidden rounded-3xl border border-navy/10 shadow-lift sm:min-h-[360px]">
                    <Image
                      src={d.imageUrl}
                      alt={d.imageAlt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-charcoal/70 to-transparent" />
                    {d.imageCaption ? (
                      <p className="absolute bottom-6 left-6 max-w-xs text-sm font-medium text-cream">{d.imageCaption}</p>
                    ) : null}
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">{d.title}</h2>
                    <p className="mt-4 text-charcoal/85">{d.body}</p>
                    <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {d.pills.map((w) => (
                        <li
                          key={w}
                          className="rounded-xl border border-navy/10 bg-white/90 px-4 py-3 text-center text-sm font-medium text-navy shadow-sm"
                        >
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            );
          }
          case "local_service_area": {
            const d = section.data;
            const body = interpolateLocalBody(d.bodyTemplate, d.cityListPlaceholder || cityListComma());
            return (
              <section key={section.id} className="animate-fade-up rounded-3xl border border-navy/10 bg-navy py-16 text-cream">
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{d.title}</h2>
                  <p className="mt-4 text-cream/85">{body}</p>
                  <CtaLink cta={d.cta} className="mt-6 inline-block text-sm font-semibold text-aqua no-underline hover:underline" />
                </div>
              </section>
            );
          }
          case "how_it_works": {
            const d = section.data;
            return (
              <section key={section.id} className="animate-fade-up py-20">
                <h2 className="text-3xl font-semibold tracking-tight text-navy">{d.title}</h2>
                <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {d.steps.map((step, i) => (
                    <li
                      key={`${section.id}-${i}`}
                      className="rounded-2xl border border-navy/10 bg-white/90 p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-aqua/35 hover:shadow-lift"
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-aqua">Step {i + 1}</span>
                      <p className="mt-3 font-semibold text-navy">{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            );
          }
          case "documentation_trust": {
            const d = section.data;
            return (
              <section key={section.id} className="animate-fade-up border-y border-navy/10 bg-white/70 py-16 backdrop-blur-sm">
                <div className="mx-auto max-w-3xl">
                  <h2 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">{d.title}</h2>
                  <p className="mt-4 text-charcoal/85">{d.body}</p>
                </div>
              </section>
            );
          }
          case "faq_embed": {
            const d = section.data;
            return (
              <section key={section.id} className="animate-fade-up py-16">
                <div className="mx-auto w-full max-w-3xl">
                  <h2 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">{d.title}</h2>
                  <div className="mt-8">
                    <FaqAccordion items={FAQ_ITEMS} />
                  </div>
                </div>
              </section>
            );
          }
          case "footer_cta": {
            const d = section.data;
            return (
              <section
                key={section.id}
                className="animate-fade-up rounded-3xl border border-white/10 bg-charcoal px-6 py-14 text-center text-cream"
              >
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{d.title}</h2>
                <p className="mx-auto mt-3 max-w-xl text-cream/80">{d.body}</p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                  <CtaLink cta={d.primaryCta} className="btn-primary-lg" />
                  <CtaLink cta={d.secondaryCta} className="btn-secondary-lg border-cream/25 bg-transparent text-cream" />
                </div>
              </section>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}
