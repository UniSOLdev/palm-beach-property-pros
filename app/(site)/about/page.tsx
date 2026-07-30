import type { Metadata } from "next";
import Link from "next/link";
import { TeamSection } from "@/components/marketing/team-section";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { CTA } from "@/lib/cta";
import { TEAM_CONTENT } from "@/lib/team";
import { PHONE_DISPLAY, PHONE_TEL, QUOTE_PATH, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${SITE_NAME} — a locally operated Palm Beach County team for cleaning, property care, recurring maintenance, and mobile detailing.`,
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  const breadcrumbs = [
    { name: "Home", href: SITE_URL },
    { name: "About", href: `${SITE_URL}/about` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <div className="bg-cream">
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-ocean">About</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-navy md:text-4xl">
              Local property care with clear communication
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/85">
              {SITE_NAME} helps homeowners, property managers, and businesses across Palm Beach
              County keep properties clean, presentable, and ready—whether you live here year-round
              or manage a seasonal estate.
            </p>
          </div>
        </section>

        <section className="border-t border-navy/[0.06] bg-white/50 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-0">
            <TeamSection compact />
          </div>
        </section>

        {TEAM_CONTENT.ownerName ? (
          <section className="py-12 md:py-16">
            <div className="mx-auto max-w-3xl rounded-2xl border border-navy/[0.08] bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold text-navy">{TEAM_CONTENT.ownerName}</p>
              <p className="text-xs uppercase tracking-wide text-ocean">{TEAM_CONTENT.ownerTitle}</p>
            </div>
          </section>
        ) : null}

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="section-title">Ready to request service?</h2>
            <p className="section-lead mt-4">
              Share photos and property details through our estimate form—we will call or text you to
              confirm scope and next steps.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={QUOTE_PATH} className="btn-primary-lg w-full sm:w-auto">
                {CTA.primaryEstimate}
              </Link>
              <a href={PHONE_TEL} className="btn-secondary-lg w-full sm:w-auto">
                Call {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
