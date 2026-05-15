import Link from "next/link";

import { PbppCtaLink } from "@/components/pbpp-cta-link";
import { CTA_LABELS, GOOGLE_REVIEW_URL, PBPP_ROUTES } from "@/lib/cta-routes";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "@/lib/site";

export type ClientToolsVariant = "portal" | "pay-invoice" | "reviews";

const VARIANT_COPY: Record<
  ClientToolsVariant,
  { eyebrow: string; title: string; lead: string }
> = {
  portal: {
    eyebrow: "Client portal",
    title: "Your PBPP client hub",
    lead: "Quotes, scheduling, invoices, and reviews will live here—fully integrated with Palm Beach Property Pros operations.",
  },
  "pay-invoice": {
    eyebrow: "Invoices & payment",
    title: "Pay an invoice",
    lead: "Secure invoice payment and receipt history are being wired into the PBPP platform. Until then, our team can help you complete payment quickly.",
  },
  reviews: {
    eyebrow: "Reviews",
    title: "Share your experience",
    lead: "We appreciate feedback after every visit. Online review tools are being connected to your client profile.",
  },
};

type Props = {
  variant: ClientToolsVariant;
};

export function ClientToolsPlaceholder({ variant }: Props) {
  const copy = VARIANT_COPY[variant];

  return (
    <div className="bg-cream">
      <section className="mx-auto w-full max-w-2xl py-14 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean">{copy.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">{copy.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-charcoal/80">{copy.lead}</p>

        <div className="mt-8 rounded-2xl border border-navy/10 bg-white/90 p-6 shadow-card backdrop-blur-sm">
          <p className="text-sm font-semibold text-navy">Client tools are currently being upgraded</p>
          <p className="mt-2 text-sm leading-relaxed text-charcoal/75">
            {SITE_NAME} is bringing quotes, invoices, payments, and review requests into one premium
            operations experience on this website—no external portals required.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <PbppCtaLink href={PBPP_ROUTES.quote} className="btn-primary text-center text-sm">
              {CTA_LABELS.getFreeQuote}
            </PbppCtaLink>
            <PbppCtaLink href={PBPP_ROUTES.clientPortal} className="btn-secondary text-center text-sm">
              {CTA_LABELS.openClientPortal}
            </PbppCtaLink>
            <a href={PHONE_TEL} className="btn-secondary text-center text-sm">
              Call or Text {PHONE_DISPLAY}
            </a>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <ToolCard
            title="Request a quote"
            body="Photos, scope, and scheduling start here."
            href={PBPP_ROUTES.quote}
            label="Go to quote"
          />
          <ToolCard
            title="Pay an invoice"
            body="Invoice lookup and payment—coming soon."
            href={PBPP_ROUTES.payInvoice}
            label={CTA_LABELS.payInvoice}
          />
          <ToolCard
            title="Leave a review"
            body={
              GOOGLE_REVIEW_URL
                ? "Share feedback on Google or visit our reviews page."
                : "Review collection is being connected."
            }
            href={GOOGLE_REVIEW_URL || PBPP_ROUTES.reviews}
            label={CTA_LABELS.leaveReview}
            external={Boolean(GOOGLE_REVIEW_URL)}
          />
        </div>

        <p className="mt-10 text-center text-sm text-charcoal/60">
          <Link href="/services" className="font-semibold text-ocean no-underline hover:underline">
            Browse services
          </Link>
          <span className="mx-2 text-charcoal/30">·</span>
          <Link href="/" className="font-semibold text-ocean no-underline hover:underline">
            Back to home
          </Link>
        </p>
      </section>
    </div>
  );
}

function ToolCard({
  title,
  body,
  href,
  label,
  external,
}: {
  title: string;
  body: string;
  href: string;
  label: string;
  external?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white/80 p-5 shadow-sm transition hover:border-aqua/30 hover:shadow-card">
      <p className="text-sm font-semibold text-navy">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-charcoal/75">{body}</p>
      <PbppCtaLink
        href={href}
        external={external}
        className="mt-4 inline-block text-xs font-semibold text-ocean no-underline hover:underline"
      >
        {label} →
      </PbppCtaLink>
    </div>
  );
}
