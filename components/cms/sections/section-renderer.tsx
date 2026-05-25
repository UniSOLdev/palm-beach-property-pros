"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BeforeAfterSlider } from "@/components/cms/before-after-slider";
import { EditableButton } from "@/components/builder/editable/editable-button";
import { EditableImage } from "@/components/builder/editable/editable-image";
import { EditableText } from "@/components/builder/editable/editable-text";
import { FaqAccordion } from "@/components/faq-accordion";
import {
  parseSectionContent,
  type WebsiteSectionRow,
  type WebsiteSectionType,
} from "@/lib/cms/section-registry";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

type ThemeTokens = Record<string, unknown>;

export type SectionEditorBridge = {
  enabled: boolean;
  sectionId: string;
  activeField: string | null;
  setActiveField: (field: string | null) => void;
  patchField: (path: string, value: unknown) => void;
};

function fieldId(sectionId: string, path: string) {
  return `${sectionId}:${path}`;
}

function EditableField({
  editor,
  path,
  value,
  className,
  placeholder,
  multiline,
  style,
}: {
  editor?: SectionEditorBridge;
  path: string;
  value: string;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  style?: { fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl"; fontWeight?: "normal" | "medium" | "semibold" | "bold"; color?: "navy" | "ocean" | "cream" | "charcoal" | "aqua" };
}) {
  if (!editor?.enabled) {
    return value ? <span className={className}>{value}</span> : null;
  }
  const id = fieldId(editor.sectionId, path);
  return (
    <EditableText
      value={value}
      onChange={(v) => editor.patchField(path, v)}
      fieldId={id}
      activeField={editor.activeField}
      onActivate={editor.setActiveField}
      onDeactivate={() => editor.setActiveField(null)}
      className={className}
      placeholder={placeholder}
      multiline={multiline}
      style={style}
    />
  );
}

export function SectionRenderer({
  section,
  theme,
  preview = false,
  editor,
}: {
  section: WebsiteSectionRow;
  theme?: ThemeTokens;
  preview?: boolean;
  editor?: SectionEditorBridge;
}) {
  const content = parseSectionContent(section.section_type, section.content);
  const style = themeToCss(theme);

  if (!section.is_visible && !preview) return null;

  const bridge: SectionEditorBridge | undefined =
    editor?.enabled && preview
      ? { ...editor, sectionId: section.id }
      : undefined;

  return (
    <div
      data-section-id={section.id}
      data-section-type={section.section_type}
      style={style}
      className={!section.is_visible ? "opacity-40" : undefined}
    >
      <SectionBody type={section.section_type} content={content} editor={bridge} />
    </div>
  );
}

function SectionBody({
  type,
  content,
  editor,
}: {
  type: WebsiteSectionType;
  content: Record<string, unknown>;
  editor?: SectionEditorBridge;
}) {
  switch (type) {
    case "hero":
      return <HeroView content={content} editor={editor} />;
    case "services":
      return <ServicesView content={content} editor={editor} />;
    case "stats":
      return <StatsView content={content} />;
    case "testimonials":
      return <TestimonialsView content={content} editor={editor} />;
    case "faq":
      return <FaqView content={content} editor={editor} />;
    case "cta":
      return <CtaView content={content} editor={editor} />;
    case "quote_form":
      return <QuoteFormView content={content} editor={editor} />;
    case "gallery":
      return <GalleryView content={content} editor={editor} />;
    case "before_after":
      return <BeforeAfterView content={content} editor={editor} />;
    case "service_areas":
      return <GenericBlockView content={content} label="Service areas" editor={editor} />;
    case "pricing":
      return <GenericBlockView content={content} label="Pricing" editor={editor} />;
    case "process":
      return <ProcessView content={content} editor={editor} />;
    case "team":
      return <GenericBlockView content={content} label="Team" editor={editor} />;
    case "video":
      return <VideoView content={content} editor={editor} />;
    case "contact":
      return <ContactView content={content} editor={editor} />;
    case "rich_text":
      return <RichTextView content={content} editor={editor} />;
    default:
      return null;
  }
}

function HeroView({ content, editor }: { content: Record<string, unknown>; editor?: SectionEditorBridge }) {
  const c = content as {
    eyebrow?: string;
    headline?: string;
    subheadline?: string;
    imageUrl?: string;
    overlayOpacity?: number;
    alignment?: "left" | "center" | "right";
    textMaxWidth?: "sm" | "md" | "lg" | "full";
    animateEntrance?: boolean;
    chips?: string[];
    primaryCta?: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
  };
  const alignClass = c.alignment === "center" ? "text-center items-center" : c.alignment === "right" ? "text-right items-end" : "text-left items-start";
  const maxW = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", full: "max-w-full" }[c.textMaxWidth ?? "lg"];
  const overlay = (c.overlayOpacity ?? 55) / 100;
  const entrance = c.animateEntrance !== false ? "section-soft-in" : "";

  return (
    <section className={`relative overflow-hidden rounded-3xl bg-charcoal ${entrance}`}>
      {c.imageUrl || editor?.enabled ? (
        <div className="absolute inset-0">
          {editor?.enabled ? (
            <EditableImage
              value={c.imageUrl ?? ""}
              onChange={(v) => editor.patchField("imageUrl", v)}
              fieldId={fieldId(editor.sectionId, "imageUrl")}
              activeField={editor.activeField}
              onActivate={editor.setActiveField}
              className="absolute inset-0 h-full w-full"
            />
          ) : c.imageUrl ? (
            <Image src={c.imageUrl} alt="" fill className="object-cover" sizes="100vw" style={{ opacity: 1 - overlay * 0.3 }} />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/30 pointer-events-none" style={{ opacity: overlay }} />
        </div>
      ) : null}
      <div className={`relative flex flex-col px-6 py-20 sm:py-28 ${alignClass}`}>
        <div className={maxW}>
          <EditableField editor={editor} path="eyebrow" value={c.eyebrow ?? ""} className="text-xs font-semibold uppercase tracking-[0.28em] text-aqua/90" placeholder="Eyebrow" style={{ fontSize: "xs", color: "aqua" }} />
          <h1 className="mt-5">
            <EditableField editor={editor} path="headline" value={c.headline ?? ""} className="text-4xl font-semibold tracking-tight text-cream sm:text-5xl" placeholder="Headline" style={{ fontSize: "4xl", fontWeight: "semibold", color: "cream" }} />
          </h1>
          <p className="mt-6 text-lg text-silver/95">
            <EditableField editor={editor} path="subheadline" value={c.subheadline ?? ""} multiline placeholder="Subheadline" style={{ fontSize: "lg", color: "charcoal" }} />
          </p>
          {c.chips?.length ? (
            <ul className={`mt-8 flex flex-wrap gap-2 ${c.alignment === "center" ? "justify-center" : c.alignment === "right" ? "justify-end" : ""}`}>
              {c.chips.map((chip) => (
                <li key={chip} className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-cream/95 backdrop-blur-md">
                  {chip}
                </li>
              ))}
            </ul>
          ) : null}
          <div className={`mt-10 flex flex-col gap-3 sm:flex-row ${c.alignment === "center" ? "sm:justify-center" : c.alignment === "right" ? "sm:justify-end" : ""}`}>
            {editor?.enabled ? (
              <>
                <EditableButton
                  label={c.primaryCta?.label ?? "Get a quote"}
                  onLabelChange={(v) => editor.patchField("primaryCta", { ...(c.primaryCta ?? { href: "/quote" }), label: v })}
                  fieldId={fieldId(editor.sectionId, "primaryCta.label")}
                  activeField={editor.activeField}
                  onActivate={editor.setActiveField}
                  onDeactivate={() => editor.setActiveField(null)}
                  variant="primary"
                />
                {c.secondaryCta ? (
                  <EditableButton
                    label={c.secondaryCta.label}
                    onLabelChange={(v) => editor.patchField("secondaryCta", { ...c.secondaryCta, label: v })}
                    fieldId={fieldId(editor.sectionId, "secondaryCta.label")}
                    activeField={editor.activeField}
                    onActivate={editor.setActiveField}
                    onDeactivate={() => editor.setActiveField(null)}
                    variant="secondary"
                    className="border-white/25 bg-white/10 text-cream"
                  />
                ) : null}
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesView({ content, editor }: { content: Record<string, unknown>; editor?: SectionEditorBridge }) {
  const c = content as {
    headline?: string;
    subheadline?: string;
    columnCount?: string;
    cardStyle?: "minimal" | "elevated" | "bordered";
    columns?: Array<{ title: string; body: string; icon?: string; imageUrl?: string; links?: Array<{ label: string; href: string }> }>;
  };
  const cols = c.columnCount ?? "3";
  const gridClass = cols === "2" ? "lg:grid-cols-2" : cols === "4" ? "lg:grid-cols-4" : "lg:grid-cols-3";
  const cardClass =
    c.cardStyle === "minimal"
      ? "p-4"
      : c.cardStyle === "bordered"
        ? "rounded-2xl border border-navy/10 p-6 transition hover:border-ocean/30"
        : "rounded-2xl bg-white/80 p-6 shadow-card transition hover:shadow-lift hover:-translate-y-0.5";

  return (
    <section className="rounded-3xl border border-navy/10 bg-gradient-to-b from-white to-cream/80 py-16 shadow-card">
      <div className="mx-auto max-w-2xl text-center px-4">
        <h2 className="text-3xl font-semibold text-navy">
          <EditableField editor={editor} path="headline" value={c.headline ?? ""} placeholder="Section headline" style={{ fontSize: "3xl", fontWeight: "semibold", color: "navy" }} />
        </h2>
        <p className="mt-4 text-charcoal/80">
          <EditableField editor={editor} path="subheadline" value={c.subheadline ?? ""} multiline placeholder="Subheadline" />
        </p>
      </div>
      <div className={`mt-12 grid gap-8 px-4 ${gridClass}`}>
        {(c.columns ?? []).map((col) => (
          <div key={col.title} className={cardClass}>
            {col.icon ? <span className="text-2xl text-ocean">{col.icon}</span> : null}
            {col.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={col.imageUrl} alt="" className="mb-4 h-32 w-full rounded-xl object-cover" />
            ) : null}
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

function TestimonialsView({ content, editor }: { content: Record<string, unknown>; editor?: SectionEditorBridge }) {
  const c = content as {
    headline?: string;
    carousel?: boolean;
    items?: Array<{ quote: string; author: string; rating?: number; photoUrl?: string }>;
  };
  const items = c.items ?? [];
  const [active, setActive] = useState(0);

  if (c.carousel && items.length > 1) {
    const item = items[active] ?? items[0];
    return (
      <section className="py-16 px-4">
        <h2 className="text-center text-2xl font-semibold text-navy">
          <EditableField editor={editor} path="headline" value={c.headline ?? ""} placeholder="Testimonials headline" style={{ fontSize: "2xl", fontWeight: "semibold", color: "navy" }} />
        </h2>
        <div className="mx-auto mt-10 max-w-2xl glass-panel p-8 text-center">
          {item.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.photoUrl} alt={item.author} className="mx-auto h-16 w-16 rounded-full object-cover" />
          ) : null}
          {item.rating ? <p className="mt-4 text-aqua">{"★".repeat(item.rating)}</p> : null}
          <p className="mt-4 text-lg text-charcoal/85">&ldquo;{item.quote}&rdquo;</p>
          <p className="mt-4 text-sm font-semibold text-navy">— {item.author}</p>
          <div className="mt-6 flex justify-center gap-2">
            {items.map((_, i) => (
              <button key={i} type="button" onClick={() => setActive(i)} className={`h-2 w-2 rounded-full transition ${i === active ? "bg-ocean w-6" : "bg-charcoal/20"}`} aria-label={`Testimonial ${i + 1}`} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <h2 className="text-center text-2xl font-semibold text-navy">
        <EditableField editor={editor} path="headline" value={c.headline ?? ""} placeholder="Testimonials headline" style={{ fontSize: "2xl", fontWeight: "semibold", color: "navy" }} />
      </h2>
      <ul className="mt-10 grid gap-5 px-4 md:grid-cols-2">
        {items.map((item, i) => (
          <li key={i} className="glass-panel p-6 transition hover:shadow-lift">
            <div className="flex items-center gap-3">
              {item.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photoUrl} alt={item.author} className="h-10 w-10 rounded-full object-cover" />
              ) : null}
              <div>
                {item.rating ? <p className="text-aqua text-sm">{"★".repeat(item.rating)}</p> : null}
                <p className="text-sm font-semibold text-navy">{item.author}</p>
              </div>
            </div>
            <p className="mt-3 text-charcoal/85">&ldquo;{item.quote}&rdquo;</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FaqView({ content, editor }: { content: Record<string, unknown>; editor?: SectionEditorBridge }) {
  const c = content as { headline?: string; items?: Array<{ question: string; answer: string }> };
  const items = c.items ?? [];
  if (!items.length) {
    return (
      <section className="py-12 px-4">
        <h2 className="text-2xl font-semibold text-navy">
          <EditableField editor={editor} path="headline" value={c.headline ?? "FAQ"} style={{ fontSize: "2xl", fontWeight: "semibold", color: "navy" }} />
        </h2>
        <p className="mt-4 text-sm text-charcoal/60">Add FAQ items in the section editor.</p>
      </section>
    );
  }
  return (
    <section className="py-12 px-4">
      <h2 className="mb-8 text-2xl font-semibold text-navy">
        <EditableField editor={editor} path="headline" value={c.headline ?? ""} style={{ fontSize: "2xl", fontWeight: "semibold", color: "navy" }} />
      </h2>
      <FaqAccordion items={items.map((i) => ({ question: i.question, answer: i.answer }))} />
    </section>
  );
}

function CtaView({ content, editor }: { content: Record<string, unknown>; editor?: SectionEditorBridge }) {
  const c = content as {
    headline?: string;
    body?: string;
    primaryCta?: { label: string; href: string };
    phone?: string;
    gradientBg?: boolean;
    buttonTheme?: "light" | "dark" | "ocean";
  };
  const bgClass = c.gradientBg !== false
    ? "bg-gradient-to-br from-navy via-navy to-ocean"
    : "bg-navy";
  const btnClass =
    c.buttonTheme === "ocean"
      ? "btn-primary-lg"
      : c.buttonTheme === "dark"
        ? "btn-secondary-lg border-white/25 bg-white/10 text-cream"
        : "btn-inverse-lg";

  return (
    <section className={`rounded-3xl px-6 py-16 text-center text-cream ${bgClass}`}>
      <h2 className="text-3xl font-semibold">
        <EditableField editor={editor} path="headline" value={c.headline ?? ""} placeholder="CTA headline" style={{ fontSize: "3xl", fontWeight: "semibold", color: "cream" }} />
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-silver/90">
        <EditableField editor={editor} path="body" value={c.body ?? ""} multiline placeholder="Supporting text" />
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {editor?.enabled ? (
          <EditableButton
            label={c.primaryCta?.label ?? "Get started"}
            onLabelChange={(v) => editor.patchField("primaryCta", { ...(c.primaryCta ?? { href: "/quote" }), label: v })}
            fieldId={fieldId(editor.sectionId, "primaryCta.label")}
            activeField={editor.activeField}
            onActivate={editor.setActiveField}
            onDeactivate={() => editor.setActiveField(null)}
            variant="inverse"
          />
        ) : c.primaryCta ? (
          <Link href={c.primaryCta.href} className={btnClass}>
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

function QuoteFormView({ content, editor }: { content: Record<string, unknown>; editor?: SectionEditorBridge }) {
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

function GalleryView({ content, editor }: { content: Record<string, unknown>; editor?: SectionEditorBridge }) {
  const c = content as { headline?: string; layout?: "grid" | "masonry"; items?: Array<{ label: string; imageUrl?: string }> };
  const isMasonry = (c.layout ?? "masonry") === "masonry";

  return (
    <section className="py-12 px-4">
      {c.headline ? <h2 className="text-2xl font-semibold text-navy">{c.headline}</h2> : null}
      <ul className={`mt-8 gap-3 ${isMasonry ? "columns-2 md:columns-3" : "grid grid-cols-2 md:grid-cols-3"}`}>
        {(c.items ?? []).map((item, i) => (
          <li key={i} className={`overflow-hidden rounded-xl ${isMasonry ? "mb-3 break-inside-avoid" : ""}`}>
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.label} className="w-full object-cover transition hover:scale-[1.02]" loading="lazy" />
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

function BeforeAfterView({ content, editor }: { content: Record<string, unknown>; editor?: SectionEditorBridge }) {
  const c = content as {
    headline?: string;
    pairs?: Array<{ label: string; beforeUrl?: string; afterUrl?: string }>;
  };
  return (
    <section className="py-12 px-4">
      {c.headline ? <h2 className="text-2xl font-semibold text-navy">{c.headline}</h2> : null}
      <ul className="mt-8 grid gap-6 md:grid-cols-2">
        {(c.pairs ?? []).map((pair, i) => (
          <li key={i}>
            <BeforeAfterSlider beforeUrl={pair.beforeUrl} afterUrl={pair.afterUrl} label={pair.label} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProcessView({ content, editor }: { content: Record<string, unknown>; editor?: SectionEditorBridge }) {
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

function VideoView({ content, editor }: { content: Record<string, unknown>; editor?: SectionEditorBridge }) {
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

function ContactView({ content, editor }: { content: Record<string, unknown>; editor?: SectionEditorBridge }) {
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

function RichTextView({ content, editor }: { content: Record<string, unknown>; editor?: SectionEditorBridge }) {
  const c = content as { headline?: string; body?: string };
  return (
    <section className="prose prose-navy max-w-none px-4 py-12">
      <h2 className="text-2xl font-semibold text-navy">
        <EditableField editor={editor} path="headline" value={c.headline ?? ""} style={{ fontSize: "2xl", fontWeight: "semibold", color: "navy" }} />
      </h2>
      <div className="mt-4 whitespace-pre-wrap text-charcoal/85 leading-relaxed">
        <EditableField editor={editor} path="body" value={c.body ?? ""} multiline placeholder="Rich text body" />
      </div>
    </section>
  );
}

function GenericBlockView({ content, label, editor }: { content: Record<string, unknown>; label: string; editor?: SectionEditorBridge }) {
  const c = content as { headline?: string; body?: string };
  return (
    <section className="py-12 px-4">
      <h2 className="text-2xl font-semibold text-navy">
        <EditableField editor={editor} path="headline" value={c.headline ?? label} placeholder={label} style={{ fontSize: "2xl", fontWeight: "semibold", color: "navy" }} />
      </h2>
      <p className="mt-4 text-charcoal/80">
        <EditableField editor={editor} path="body" value={c.body ?? ""} multiline placeholder="Body copy" />
      </p>
    </section>
  );
}

function themeToCss(theme?: ThemeTokens): React.CSSProperties | undefined {
  if (!theme) return undefined;
  return {
    ["--cms-primary" as string]: (theme.colorPrimary as string) ?? undefined,
    ["--cms-accent" as string]: (theme.colorAccent as string) ?? undefined,
    ["--cms-bg" as string]: (theme.colorBackground as string) ?? undefined,
    ["--cms-surface" as string]: (theme.colorSurface as string) ?? undefined,
    ["--cms-radius" as string]: (theme.radiusLg as string) ?? undefined,
    ["--cms-shadow" as string]: (theme.shadowSoft as string) ?? undefined,
    ["--cms-gradient" as string]: (theme.gradientHero as string) ?? undefined,
    fontFamily: (theme.fontBody as string) ?? undefined,
    backgroundColor: (theme.colorBackground as string) ?? undefined,
  };
}

export function PagePreview({
  sections,
  theme,
  selectedId,
  onSelectSection,
}: {
  sections: WebsiteSectionRow[];
  theme?: ThemeTokens;
  selectedId?: string | null;
  onSelectSection?: (id: string) => void;
}) {
  const wrapperStyle = themeToCss(theme);

  return (
    <div className="space-y-6 bg-cream/50 p-4 md:p-8" style={wrapperStyle}>
      {sections.map((section) => (
        <div
          key={section.id}
          role={onSelectSection ? "button" : undefined}
          tabIndex={onSelectSection ? 0 : undefined}
          onClick={() => onSelectSection?.(section.id)}
          onKeyDown={(e) => e.key === "Enter" && onSelectSection?.(section.id)}
          className={`group relative cursor-pointer rounded-3xl transition-all duration-300 ${
            selectedId === section.id
              ? "ring-2 ring-ocean ring-offset-2 shadow-lift"
              : "hover:ring-1 hover:ring-ocean/30"
          } ${!section.is_visible ? "opacity-40" : ""}`}
        >
          {onSelectSection ? (
            <span className="absolute right-3 top-3 z-10 rounded-full bg-navy/80 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
              Edit
            </span>
          ) : null}
          <SectionRenderer section={section} theme={theme} preview />
        </div>
      ))}
    </div>
  );
}
