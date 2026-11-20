import type { Metadata } from "next";
import { ScrollChapter } from "@/components/site/experiences/scroll-chapter";
import type { ExperienceManifest } from "@/components/site/experiences/frame-loader";
import { QuoteForm } from "@/components/site/quote-form";
import holidayInstall from "@/lib/site/experiences/holiday-install.json";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Holiday & Christmas Light Installation | Palm Beach Property Pros" },
  description:
    "Christmas and holiday lighting for Palm Beach estates: warm-white rooflines, wrapped palms, lit hedges and wreaths. Designed, installed, looked after through the season, and taken down. Request a private quote.",
  alternates: { canonical: "/holiday-lighting" },
  openGraph: {
    title: "Your estate, lit for the season",
    description: "Holiday lighting for Palm Beach estates, designed, installed, and taken down by one discreet team.",
    url: "/holiday-lighting",
    images: [{ url: "/photos/holiday-lighting-estate.jpg", width: 1600, height: 900 }],
  },
};

const LIGHT = [
  { title: "Rooflines & facade", body: "Clean, continuous warm-white lines along the eaves and the string course, measured to your architecture." },
  { title: "Palms", body: "Royal and coconut palm trunks wrapped in even spirals, with uplights to the crowns." },
  { title: "Hedges & landscape", body: "Net lights tailored to clipped hedges, plus garden and walkway accents." },
  { title: "Entry & wreaths", body: "Wreaths and garland at the front door, gates, and arched windows." },
];

const STEPS = [
  { n: "01", title: "Walkthrough", body: "We walk the property with you (or by video if you're away) and agree a lighting plan." },
  { n: "02", title: "Installation", body: "Our crew installs on your schedule. Away for the season? We finish before you arrive and send photos." },
  { n: "03", title: "Through the season", body: "Timers handle on and off. If a strand fails, we come back and fix it." },
  { n: "04", title: "Take-down", body: "After the holidays everything comes down at a time that suits you." },
];

const TRUST = ["Licensed & insured", "Local Palm Beach County crew", "Installed while you're away", "Take-down included"];

export default function HolidayLightingPage() {
  // The embedded form reads utm_* from this page's URL, so ad and referral leads stay attributed.
  return (
    <>
      <section className="relative -mt-[72px] overflow-hidden bg-navy-deep md:flex md:min-h-[92svh] md:items-end">
        <picture>
          {/* Phones get a 4:5 crop; AVIF (~26 KB on a phone) with WebP and JPEG fallbacks. */}
          <source media="(max-aspect-ratio: 1/1)" width={1080} height={1350} type="image/avif" sizes="100vw" srcSet="/photos/holiday-lighting-portrait-540.avif 540w, /photos/holiday-lighting-portrait-828.avif 828w, /photos/holiday-lighting-portrait-1080.avif 1080w" />
          <source media="(max-aspect-ratio: 1/1)" width={1080} height={1350} type="image/webp" sizes="100vw" srcSet="/photos/holiday-lighting-portrait-540.webp 540w, /photos/holiday-lighting-portrait-828.webp 828w, /photos/holiday-lighting-portrait-1080.webp 1080w" />
          <source media="(max-aspect-ratio: 1/1)" width={1080} height={1350} srcSet="/photos/holiday-lighting-portrait.jpg" />
          <source type="image/avif" sizes="100vw" srcSet="/photos/holiday-lighting-estate-960.avif 960w, /photos/holiday-lighting-estate-1600.avif 1600w" />
          <source type="image/webp" sizes="100vw" srcSet="/photos/holiday-lighting-estate-960.webp 960w, /photos/holiday-lighting-estate-1600.webp 1600w" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/photos/holiday-lighting-estate.jpg"
            alt="Mediterranean-style estate at dusk with warm holiday lights on the roofline, palms, and hedges"
            width={1600}
            height={900}
            fetchPriority="high"
            decoding="async"
            className="block aspect-[4/5] w-full object-cover md:absolute md:inset-0 md:aspect-auto md:h-full"
          />
        </picture>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-deep to-transparent md:inset-0 md:h-auto md:via-navy-deep/30" />
        <div className="relative z-10 mx-auto -mt-16 w-full max-w-5xl px-5 pb-28 sm:px-8 md:mt-0 md:pb-20 md:pt-40">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cream/85">Holiday lighting · Now booking</p>
          <h1 className="font-display mt-4 max-w-3xl text-5xl font-medium leading-[1.04] text-white sm:text-7xl">
            Your estate, lit for the season.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream sm:text-xl">
            Warm-white rooflines, wrapped palms, glowing hedges and wreaths at the door. Designed, installed, looked after through
            the holidays, and taken down, by one discreet team.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#quote" className="btn-gold w-full sm:w-auto">Request a holiday lighting quote</a>
            <a href={PHONE_TEL} className="btn-ghost-light w-full sm:w-auto">Call {PHONE_DISPLAY}</a>
          </div>
          <p className="mt-5 text-sm text-cream/80">Install dates fill quickly from late November. Book early for lights by mid-December.</p>
        </div>
      </section>

      <section aria-label="Why clients choose us" className="border-b border-navy/10 bg-cream px-5 py-6 sm:px-8">
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-medium text-navy/80">
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#C2A06A]" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Scroll to watch the lights go up: roofline, palms, hedges, wreaths, windows. */}
      <ScrollChapter
        id="install"
        manifest={holidayInstall as unknown as ExperienceManifest}
        number=""
        kicker="Scroll to light it up"
        title="One visit. Every line, lit."
        body="Rooflines first, then the palms, the hedges and the entry, finished before you arrive."
        service="Holiday Lighting"
        quoteHref="#quote"
        length={320}
      />

      <section className="bg-cream px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy/70">What we light</p>
          <h2 className="font-display mt-3 max-w-2xl text-4xl font-medium text-navy sm:text-5xl">Every line of the house, in one warm white.</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {LIGHT.map((l) => (
              <div key={l.title} className="border-t border-navy/15 pt-6">
                <h3 className="font-display text-2xl text-navy">{l.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-charcoal/80">{l.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream-warm px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy/70">How it works</p>
          <h2 className="font-display mt-3 max-w-2xl text-4xl font-medium text-navy sm:text-5xl">One call. No ladders. Nothing to untangle in January.</h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="font-display text-4xl text-brass-dark">{s.n}</span>
                <h3 className="font-display mt-2 text-2xl text-navy">{s.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-charcoal/80">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="quote" className="scroll-mt-24 bg-cream-warm px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy/70">Reserve your install date</p>
            <h2 className="font-display mt-3 text-4xl font-medium text-navy sm:text-5xl">Tell us about the property.</h2>
            <p className="mt-5 text-lg leading-relaxed text-charcoal/80">
              A few details and your preferred dates. We respond personally, usually within one business day, with a private
              quote. No obligation.
            </p>
            <p className="mt-8 text-base text-charcoal/70">Prefer to talk?</p>
            <a href={PHONE_TEL} className="font-display mt-1 block text-4xl text-navy no-underline hover:text-brass-dark">{PHONE_DISPLAY}</a>
          </div>
          <QuoteForm defaultService="Holiday Lighting" idPrefix="holiday" />
        </div>
      </section>
    </>
  );
}
