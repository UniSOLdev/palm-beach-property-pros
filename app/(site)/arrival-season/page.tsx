import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Arrival Season Preparation for Seasonal Residents | Palm Beach Property Pros" },
  description:
    "Arriving for the season? One call readies the whole estate: home opened and cleaned, grounds and hardscape refreshed, cars detailed, holiday lighting on. Request a private quote.",
  alternates: { canonical: "/arrival-season" },
};

const QUOTE = `/quote?service=${encodeURIComponent("Arrival & Departure Prep")}`;

const PACKAGE = [
  { title: "Home opened & checked", body: "Systems, doors, windows and water checked; air set to your arrival temperature; anything that needs a vendor flagged and coordinated." },
  { title: "Estate cleaning", body: "Every room refreshed after the off-season, linens fresh, glass streak-free inside and out." },
  { title: "Grounds & hardscape", body: "Landscape tidied, terraces, driveway and pool deck pressure washed, debris cleared." },
  { title: "Cars detailed", body: "Vehicles washed and refreshed at the residence, ready for the first drive." },
  { title: "Holiday lighting", body: "Arriving for the holidays? We can have the house lit before you pull in." },
  { title: "Groceries & errands", body: "Kitchen stocked to your list, flowers placed, deliveries received." },
];

export default function ArrivalSeasonPage() {
  return (
    <>
      <section className="relative -mt-[72px] flex min-h-[80svh] items-end overflow-hidden bg-navy-deep">
        <Image
          src="/photos/hero-estate-golden-hour.jpg"
          alt="Mediterranean-style estate and pool terrace at golden hour"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/40 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-28 pt-40 sm:px-8 md:pb-20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cream/85">Arrival season</p>
          <h1 className="font-display mt-4 max-w-3xl text-5xl font-medium leading-[1.04] text-white sm:text-7xl">
            Arrive to a house that&apos;s already ready.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream sm:text-xl">
            Tell us your arrival date. We open, clean, refresh and stock the estate, and coordinate every vendor, so the season
            starts the moment you walk in.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={QUOTE} className="btn-gold w-full sm:w-auto">Plan my arrival</Link>
            <a href={PHONE_TEL} className="btn-ghost-light w-full sm:w-auto">Call {PHONE_DISPLAY}</a>
          </div>
        </div>
      </section>

      <section className="bg-cream px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy/70">One call covers</p>
          <h2 className="font-display mt-3 max-w-2xl text-4xl font-medium text-navy sm:text-5xl">Everything between the off-season and your first evening home.</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {PACKAGE.map((p) => (
              <div key={p.title} className="border-t border-navy/15 pt-6">
                <h3 className="font-display text-2xl text-navy">{p.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-charcoal/80">{p.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 max-w-2xl text-base text-charcoal/80">
            Choose what you need: the full arrival, or just a few pieces. Departure works the same in reverse: closed up,
            secured, and watched while you&apos;re away.
          </p>
        </div>
      </section>

      <section className="bg-navy-deep px-5 py-24 text-center sm:px-8">
        <h2 className="font-display mx-auto max-w-3xl text-4xl font-medium text-white sm:text-6xl">When do you arrive?</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-cream">Share the date and the property. We&apos;ll reply personally with a plan and a private quote.</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={QUOTE} className="btn-gold w-full sm:w-auto">Plan my arrival</Link>
          <Link href="/holiday-lighting" className="btn-ghost-light w-full sm:w-auto">Holiday lighting</Link>
        </div>
      </section>
    </>
  );
}
