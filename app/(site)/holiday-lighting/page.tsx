import type { Metadata } from "next";
import Link from "next/link";
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

/** Carry ad / referral tags (utm_*) through to the quote form so paid leads stay attributed. */
function quoteHref(sp: Record<string, string | string[] | undefined>) {
  const q = new URLSearchParams({ service: "Holiday Lighting" });
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    const v = sp[k];
    if (typeof v === "string" && v) q.set(k, v.slice(0, 80));
  }
  return `/quote?${q.toString()}`;
}

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

export default async function HolidayLightingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const QUOTE = quoteHref(await searchParams);
  return (
    <>
      <section className="relative -mt-[72px] overflow-hidden bg-navy-deep md:flex md:min-h-[92svh] md:items-end">
        <picture>
          <source media="(max-aspect-ratio: 1/1)" srcSet="/photos/holiday-lighting-portrait.jpg" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/photos/holiday-lighting-estate.jpg"
            alt="Mediterranean-style estate at dusk with warm holiday lights on the roofline, palms, and hedges"
            width={1600}
            height={900}
            fetchPriority="high"
            className="block h-auto w-full md:absolute md:inset-0 md:h-full md:object-cover"
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
            <Link href={QUOTE} className="btn-gold w-full sm:w-auto">Request a holiday lighting quote</Link>
            <a href={PHONE_TEL} className="btn-ghost-light w-full sm:w-auto">Call {PHONE_DISPLAY}</a>
          </div>
          <p className="mt-5 text-sm text-cream/80">Install dates fill quickly from late November. Book early for lights by mid-December.</p>
        </div>
      </section>

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

      <section className="bg-navy-deep px-5 py-24 text-center sm:px-8">
        <h2 className="font-display mx-auto max-w-3xl text-4xl font-medium text-white sm:text-6xl">Reserve your install date.</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-cream">Tell us about the property and when you&apos;d like it lit. We&apos;ll respond personally with a private quote.</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={QUOTE} className="btn-gold w-full sm:w-auto">Request a holiday lighting quote</Link>
          <a href={PHONE_TEL} className="btn-ghost-light w-full sm:w-auto">Call {PHONE_DISPLAY}</a>
        </div>
      </section>
    </>
  );
}
