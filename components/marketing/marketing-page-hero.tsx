import Link from "next/link";
import { PageHeroImage } from "@/components/marketing/page-hero-image";
import type { MediaAsset } from "@/lib/media/types";

type Cta = { href: string; label: string };

export function MarketingPageHero({
  eyebrow,
  title,
  lead,
  image,
  cta,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  image?: MediaAsset;
  cta?: Cta;
  children?: React.ReactNode;
}) {
  const copy = (
    <>
      <p className="section-eyebrow text-ocean">{eyebrow}</p>
      <h1 className="section-title mt-3">{title}</h1>
      <p className="section-lead mt-4">{lead}</p>
      {cta ? (
        <Link href={cta.href} className="btn-primary mt-8 inline-flex min-h-[48px] px-8">
          {cta.label}
        </Link>
      ) : null}
      {children}
    </>
  );

  if (!image) {
    return (
      <section className="mx-auto max-w-2xl px-2 py-10 text-center md:py-16">
        {copy}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl py-8 md:py-14">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
        <div className="text-center lg:text-left">{copy}</div>
        <PageHeroImage asset={image} className="shadow-luxury" />
      </div>
    </section>
  );
}
