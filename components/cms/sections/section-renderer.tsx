"use client";

import Image from "next/image";
import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import {
  parseSectionContent,
  type WebsiteSectionRow,
  type WebsiteSectionType,
} from "@/lib/cms/section-registry";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

type ThemeTokens = Record<string, unknown>;

export function SectionRenderer({
  section,
  theme,
  preview = false,
}: {
  section: WebsiteSectionRow;
  theme?: ThemeTokens;
  preview?: boolean;
}) {
  const content = parseSectionContent(section.section_type, section.content);
  const style = themeToCss(theme);

  if (!section.is_visible && !preview) return null;

  return (
    <div
      data-section-id={section.id}
      data-section-type={section.section_type}
      style={style}
      className={!section.is_visible ? "opacity-40" : undefined}
    >
      <SectionBody type={section.section_type} content={content} />
    </div>
  );
}

function SectionBody({
  type,
  content,
}: {
  type: WebsiteSectionType;
  content: Record<string, unknown>;
}) {
  switch (type) {
    case "hero":
      return <HeroView content={content} />;
    case "services":
      return <ServicesView content={content} />;
    case "stats":
      return <StatsView content={content} />;
    case "testimonials":
      return <TestimonialsView content={content} />;
    case "faq":
      return <FaqView content={content} />;
    case "cta":
      return <CtaView content={content} />;
    case "quote_form":
      return <QuoteFormView content={content} />;
    case "gallery":
      return <GalleryView content={content} />;
    case "before_after":
      return <BeforeAfterView content={content} />;
    case "service_areas":
      return <GenericBlockView content={content} label="Service areas" />;
    case "pricing":
      return <GenericBlockView content={content} label="Pricing" />;
    case "process":
      return <ProcessView content={content} />;
    case "team":
      return <GenericBlockView content={content} label="Team" />;
    case "video":
      return <VideoView content={content} />;
    case "contact":
      return <ContactView content={content} />;
    case "rich_text":
      return <RichTextView content={content} />;
    default:
      return null;
  }
}

function HeroView({ content }: { content: Record<string, unknown> }) {
  const c = content as {
    eyebrow?: string;
    headline?: string;
    subheadline?: string;
    imageUrl?: string;
    chips?: string[];
    primaryCta?: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
  };
  return (
    <section className="relative overflow-hidden rounded-3xl bg-charcoal">
      {c.imageUrl ? (
        <div className="absolute inset-0">
          <Image src={c.imageUrl} alt="" fill className="object-cover opacity-55" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/30" />
        </div>
      ) : null}
      <div className="relative px-6 py-20 sm:py-28">
        {c.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-aqua/90">{c.eyebrow}</p>
        ) : null}
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-cream sm:text-5xl">{c.headline}</h1>
        {c.subheadline ? <p className="mt-6 max-w-2xl text-lg text-silver/95">{c.subheadline}</p> : null}
        {c.chips?.length ? (
          <ul className="mt-8 flex flex-wrap gap-2">
            {c.chips.map((chip) => (
              <li key={chip} className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-cream/95 backdrop-blur-md">
                {chip}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          {c.primaryCta ? (
            <Link href={c.primaryCta.href} className="btn-primary-lg text-center">
              {c.primaryCta.label}
            </Link>
          ) : null}
          {c.secondaryCta ? (
            <Link href={c.secondaryCta.href} className="btn-secondary-lg border-white/25 bg-white/10 text-cream hover:bg-white/15">
              {c.secondaryCta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ServicesView({ content }: { content: Record<string, unknown> }) {
  const c = content as {
    headline?: string;
    subheadline?: string;
    columns?: Array<{ title: string; body: string; links?: Array<{ label: string; href: string }> }>;
  };
  return (
    <section className="rounded-3xl border border-navy/10 bg-gradient-to-b from-white to-cream/80 py-16 shadow-card">
      <div className="mx-auto max-w-2xl text-center px-4">
        {c.headline ? <h2 className="text-3xl font-semibold text-navy">{c.headline}</h2> : null}
        {c.subheadline ? <p className="mt-4 text-charcoal/80">{c.subheadline}</p> : null}
      </div>
      <div className="mt-12 grid gap-10 px-4 lg:grid-cols-3">
        {(c.columns ?? []).map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-charcoal/80">{col.title}</h3>
            <p className="mt-2 text-sm text-charcoal/75">{col.body}</p>
            <ul className="mt-6 space-y-3">
              {(col.links ?? []).map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm font-semibold text-ocean no-underline hover:underline">
                    {link.label} →
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

function StatsView({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ value: string; label: string }>) ?? [];
  return (
    <section className="rounded-2xl border border-navy/10 bg-white/60 py-12 backdrop-blur-sm">
      <ul className="grid grid-cols-2 gap-6 px-4 md:grid-cols-4">
        {items.map((item) => (
          <li key={item.label} className="text-center">
            <p className="text-3xl font-semibold text-navy">{item.value}</p>
            <p className="mt-1 text-sm text-charcoal/70">{item.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TestimonialsView({ content }: { content: Record<string, unknown> }) {
  const c = content as {
    headline?: string;
    items?: Array<{ quote: string; author: string; rating?: number }>;
  };
  return (
    <section className="py-16">
      {c.headline ? <h2 className="text-center text-2xl font-semibold text-navy">{c.headline}</h2> : null}
      <ul className="mt-10 grid gap-5 px-4 md:grid-cols-2">
        {(c.items ?? []).map((item, i) => (
          <li key={i} className="glass-panel p-6">
            {item.rating ? <p className="text-aqua">{"★".repeat(item.rating)}</p> : null}
            <p className="mt-3 text-charcoal/85">&ldquo;{item.quote}&rdquo;</p>
            <p className="mt-4 text-sm font-semibold text-navy">— {item.author}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FaqView({ content }: { content: Record<string, unknown> }) {
  const c = content as { headline?: string; items?: Array<{ question: string; answer: string }> };
  const items = c.items ?? [];
  if (!items.length) {
    return (
      <section className="py-12 px-4">
        <h2 className="text-2xl font-semibold text-navy">{c.headline ?? "FAQ"}</h2>
        <p className="mt-4 text-sm text-charcoal/60">Add FAQ items in the section editor.</p>
      </section>
    );
  }
  return (
    <section className="py-12 px-4">
      {c.headline ? <h2 className="mb-8 text-2xl font-semibold text-navy">{c.headline}</h2> : null}
      <FaqAccordion items={items.map((i) => ({ question: i.question, answer: i.answer }))} />
    </section>
  );
}

function CtaView({ content }: { content: Record<string, unknown> }) {
  const c = content as {
    headline?: string;
    body?: string;
    primaryCta?: { label: string; href: string };
    phone?: string;
  };
  return (
    <section className="rounded-3xl bg-navy px-6 py-16 text-center text-cream">
      {c.headline ? <h2 className="text-3xl font-semibold">{c.headline}</h2> : null}
      {c.body ? <p className="mx-auto mt-4 max-w-xl text-silver/90">{c.body}</p> : null}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {c.primaryCta ? (
          <Link href={c.primaryCta.href} className="btn-inverse-lg">
            {c.primaryCta.label}
          </Link>
        ) : null}
        {c.phone ? (
          <a href={`tel:${c.phone.replace(/\D/g, "")}`} className="btn-outline-light">
            Call {c.phone}
          </a>
        ) : (
          <a href={PHONE_TEL} className="btn-outline-light">
            Call {PHONE_DISPLAY}
          </a>
        )}
      </div>
    </section>
  );
}

function QuoteFormView({ content }: { content: Record<string, unknown> }) {
  const c = content as { headline?: string; body?: string; buttonLabel?: string; buttonHref?: string };
  return (
    <section className="glass-panel mx-4 p-8 text-center">
      {c.headline ? <h2 className="text-2xl font-semibold text-navy">{c.headline}</h2> : null}
      {c.body ? <p className="mt-3 text-charcoal/80">{c.body}</p> : null}
      <Link href={c.buttonHref ?? "/quote"} className="btn-primary mt-6 inline-flex">
        {c.buttonLabel ?? "Request a quote"}
      </Link>
    </section>
  );
}

function GalleryView({ content }: { content: Record<string, unknown> }) {
  const c = content as { headline?: string; items?: Array<{ label: string; imageUrl?: string }> };
  return (
    <section className="py-12 px-4">
      {c.headline ? <h2 className="text-2xl font-semibold text-navy">{c.headline}</h2> : null}
      <ul className="mt-8 columns-2 gap-3 md:columns-3">
        {(c.items ?? []).map((item, i) => (
          <li key={i} className="mb-3 break-inside-avoid overflow-hidden rounded-xl">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.label} className="w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-sky/30 text-sm text-charcoal/50">
                {item.label || "Image"}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function BeforeAfterView({ content }: { content: Record<string, unknown> }) {
  const c = content as {
    headline?: string;
    pairs?: Array<{ label: string; beforeUrl?: string; afterUrl?: string }>;
  };
  return (
    <section className="py-12 px-4">
      {c.headline ? <h2 className="text-2xl font-semibold text-navy">{c.headline}</h2> : null}
      <ul className="mt-8 grid gap-6 md:grid-cols-2">
        {(c.pairs ?? []).map((pair, i) => (
          <li key={i} className="admin-card overflow-hidden p-0">
            <div className="grid grid-cols-2">
              <div className="relative aspect-[4/3] bg-charcoal/10">
                {pair.beforeUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pair.beforeUrl} alt="Before" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-charcoal/50">Before</span>
                )}
              </div>
              <div className="relative aspect-[4/3] bg-ocean/10">
                {pair.afterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pair.afterUrl} alt="After" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-charcoal/50">After</span>
                )}
              </div>
            </div>
            {pair.label ? <p className="p-3 text-sm font-medium text-navy">{pair.label}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProcessView({ content }: { content: Record<string, unknown> }) {
  const c = content as { headline?: string; steps?: Array<{ title: string; body: string }> };
  const steps = c.steps ?? [];
  return (
    <section className="py-12 px-4">
      {c.headline ? <h2 className="text-2xl font-semibold text-navy">{c.headline}</h2> : null}
      <ol className="mt-8 space-y-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean text-sm font-bold text-white">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-navy">{step.title}</p>
              <p className="mt-1 text-sm text-charcoal/75">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function VideoView({ content }: { content: Record<string, unknown> }) {
  const c = content as { headline?: string; videoUrl?: string; posterUrl?: string };
  return (
    <section className="py-12 px-4">
      {c.headline ? <h2 className="text-2xl font-semibold text-navy">{c.headline}</h2> : null}
      {c.videoUrl ? (
        <video src={c.videoUrl} poster={c.posterUrl} controls className="mt-6 w-full rounded-2xl" />
      ) : (
        <div className="mt-6 flex aspect-video items-center justify-center rounded-2xl bg-charcoal/10 text-charcoal/50">
          Add video URL
        </div>
      )}
    </section>
  );
}

function ContactView({ content }: { content: Record<string, unknown> }) {
  const c = content as { headline?: string; body?: string; email?: string };
  return (
    <section className="py-12 px-4 text-center">
      {c.headline ? <h2 className="text-2xl font-semibold text-navy">{c.headline}</h2> : null}
      {c.body ? <p className="mt-3 text-charcoal/80">{c.body}</p> : null}
      <a href={PHONE_TEL} className="btn-primary mt-6 inline-flex">
        Call {PHONE_DISPLAY}
      </a>
      {c.email ? (
        <p className="mt-4">
          <a href={`mailto:${c.email}`} className="text-ocean">
            {c.email}
          </a>
        </p>
      ) : null}
    </section>
  );
}

function RichTextView({ content }: { content: Record<string, unknown> }) {
  const c = content as { headline?: string; body?: string };
  return (
    <section className="prose prose-navy max-w-none px-4 py-12">
      {c.headline ? <h2 className="text-2xl font-semibold text-navy">{c.headline}</h2> : null}
      {c.body ? (
        <div className="mt-4 whitespace-pre-wrap text-charcoal/85 leading-relaxed">{c.body}</div>
      ) : null}
    </section>
  );
}

function GenericBlockView({ content, label }: { content: Record<string, unknown>; label: string }) {
  const c = content as { headline?: string; body?: string };
  return (
    <section className="py-12 px-4">
      <h2 className="text-2xl font-semibold text-navy">{c.headline ?? label}</h2>
      {c.body ? <p className="mt-4 text-charcoal/80">{c.body}</p> : null}
    </section>
  );
}

function themeToCss(theme?: ThemeTokens): React.CSSProperties | undefined {
  if (!theme) return undefined;
  return {
    ["--cms-primary" as string]: (theme.colorPrimary as string) ?? undefined,
    ["--cms-accent" as string]: (theme.colorAccent as string) ?? undefined,
    ["--cms-bg" as string]: (theme.colorBackground as string) ?? undefined,
  };
}

export function PagePreview({
  sections,
  theme,
  selectedId,
}: {
  sections: WebsiteSectionRow[];
  theme?: ThemeTokens;
  selectedId?: string | null;
}) {
  return (
    <div className="space-y-8 bg-cream/50 p-4 md:p-8">
      {sections.map((section) => (
        <div
          key={section.id}
          className={`transition ${selectedId === section.id ? "ring-2 ring-ocean ring-offset-2 rounded-3xl" : ""}`}
        >
          <SectionRenderer section={section} theme={theme} preview />
        </div>
      ))}
    </div>
  );
}
