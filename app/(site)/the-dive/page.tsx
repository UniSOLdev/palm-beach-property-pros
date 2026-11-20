import type { Metadata } from "next";
import Link from "next/link";
import { ScrollChapter } from "@/components/site/experiences/scroll-chapter";
import { SpinViewer } from "@/components/site/experiences/spin-viewer";
import type { ExperienceManifest } from "@/components/site/experiences/frame-loader";
import carSpin from "@/lib/site/experiences/car-spin.json";
import poolDive from "@/lib/site/experiences/pool-dive.json";

/**
 * "The Dive": scroll-driven story of every service, following water.
 * DRAFT preview route: not linked from navigation and not indexed until approved.
 */
export const metadata: Metadata = {
  title: "The Dive",
  description: "A private look at how Palm Beach Property Pros cares for an estate, from the pool to the motor court.",
  robots: { index: false, follow: false },
};

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
        manifest={poolDive as ExperienceManifest}
        number="1"
        service="Pool & outdoor care"
        title="The Pool"
        body="Golden hour on the terrace. Fallen leaves drift to the skimmer and the water clears itself, then we dive in."
      />

      <section aria-labelledby="detailing-title" className="bg-cream px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy/70">Chapter 5 · Auto detailing</p>
          <h2 id="detailing-title" className="font-display mt-3 text-4xl font-medium text-navy sm:text-6xl">
            The Motor Court
          </h2>
          <p className="mt-4 max-w-xl text-lg text-charcoal/80">
            Snow foam lifts the grime, a pressure rinse reveals the gloss. Turn the car to see every panel.
          </p>
          <div className="mt-10">
            <SpinViewer manifest={carSpin as unknown as ExperienceManifest} labels={{ clean: "Finish", foam: "Foam" }} initial="clean" />
          </div>
          <div className="mt-10 text-center">
            <Link href="/quote" className="btn-gold inline-flex">
              Request a private quote
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
