import type { Metadata } from "next";
import Link from "next/link";
import { ScrollChapter } from "@/components/site/experiences/scroll-chapter";
import { SpinViewer } from "@/components/site/experiences/spin-viewer";
import type { ExperienceManifest } from "@/components/site/experiences/frame-loader";
import carSpin from "@/lib/site/experiences/car-spin.json";
import foamCannon from "@/lib/site/experiences/foam-cannon.json";
import glass from "@/lib/site/experiences/glass.json";
import grounds from "@/lib/site/experiences/grounds.json";
import poolDive from "@/lib/site/experiences/pool-dive.json";
import residence from "@/lib/site/experiences/residence.json";

/**
 * "The Dive": scroll-driven story of every service, following water.
 * DRAFT preview route: not linked from navigation and not indexed until approved.
 */
export const metadata: Metadata = {
  title: "The Dive",
  description:
    "A private look at how Palm Beach Property Pros cares for an estate: pool, residence, glass, grounds and motor court.",
  robots: { index: false, follow: false },
};

const quote = (service: string) => `/quote?service=${encodeURIComponent(service)}`;
const m = (j: unknown) => j as ExperienceManifest;

export default function TheDivePage() {
  return (
    <>
      <section className="relative -mt-[72px] bg-navy-deep px-5 pb-16 pt-40 text-center sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cream/80">The Dive</p>
        <h1 className="font-display mx-auto mt-4 max-w-3xl text-5xl font-medium leading-[1.05] text-white sm:text-7xl">
          Follow the water through a perfectly kept estate.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-cream">Scroll to begin.</p>
      </section>

      <ScrollChapter
        id="chapter-pool"
        manifest={m(poolDive)}
        number="1"
        service="Pool & outdoor care"
        title="The Pool"
        body="Golden hour on the terrace. Fallen leaves drift to the skimmer and the water clears itself, then we dive in."
        quoteHref={quote("Property Maintenance")}
        priority
      />

      <ScrollChapter
        id="chapter-residence"
        manifest={m(residence)}
        number="2"
        service="Estate & residential cleaning"
        title="The Residence"
        body="We surface into light: marble polished to a mirror, linen fresh, every surface ready for the family's return."
        quoteHref={quote("Residential Cleaning")}
      />

      <ScrollChapter
        id="chapter-glass"
        manifest={m(glass)}
        number="3"
        service="Window cleaning"
        title="The Glass"
        body="Floor-to-ceiling glass, streak-free, so the ocean comes back into the room."
        quoteHref={quote("Window Cleaning")}
      />

      <ScrollChapter
        id="chapter-grounds"
        manifest={m(grounds)}
        number="4"
        service="Pressure washing & grounds"
        title="The Grounds"
        body="Weathered stone washes bright again. Hedges clipped, palms groomed, the court ready for arrivals."
        quoteHref={quote("Pressure Washing / Exterior Cleaning")}
      />

      <ScrollChapter
        id="chapter-motor-court"
        manifest={m(foamCannon)}
        number="5"
        service="Auto detailing"
        title="The Motor Court"
        body="Snow foam lifts the grime; a gentle rinse reveals a mirror finish."
        quoteHref={quote("Auto Detailing")}
      />

      <section aria-labelledby="detailing-title" className="bg-cream px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy/70">Chapter 5 · Auto detailing</p>
          <h2 id="detailing-title" className="font-display mt-3 text-4xl font-medium text-navy sm:text-6xl">
            Every panel, by hand
          </h2>
          <p className="mt-4 max-w-xl text-lg text-charcoal/80">
            Turn the car to see the finish from every angle, then switch to the foam stage.
          </p>
          <div className="mt-10">
            <SpinViewer manifest={m(carSpin)} labels={{ clean: "Finish", foam: "Foam" }} initial="clean" />
          </div>
          <div className="mt-10 text-center">
            <Link href={quote("Auto Detailing")} className="btn-gold inline-flex">
              Request a private quote
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-navy-deep px-5 py-24 text-center sm:px-8">
        <h2 className="font-display mx-auto max-w-3xl text-4xl font-medium text-white sm:text-6xl">
          One discreet team for every detail of your property.
        </h2>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={quote("Multiple / not sure")} className="btn-gold w-full sm:w-auto">
            Request a private quote
          </Link>
        </div>
      </section>
    </>
  );
}
