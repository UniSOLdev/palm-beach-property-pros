import Link from "next/link";
import { DiveStory, SpinViewer, type DiveChapter, type ExperienceManifest } from "@/components/dive";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";
import carSpin from "@/lib/site/experiences/car-spin.json";
import foamCannon from "@/lib/site/experiences/foam-cannon.json";
import glass from "@/lib/site/experiences/glass.json";
import grounds from "@/lib/site/experiences/grounds.json";
import poolDive from "@/lib/site/experiences/pool-dive.json";
import residence from "@/lib/site/experiences/residence.json";

const m = (j: unknown) => j as ExperienceManifest;
const quote = (service: string) => `/quote?service=${encodeURIComponent(service)}`;
const CTA = "Request a private quote";

/** The Dive, Palm Beach Property Pros edition: the homepage story. Renders are fictional. */
export const HOME_CHAPTERS: DiveChapter[] = [
  {
    id: "chapter-pool",
    manifest: m(poolDive),
    label: "The Pool",
    service: "Pool & outdoor care",
    title: "The Pool",
    body: "Golden hour on the terrace. Leaves drift to the skimmer, the water clears, and we dive in.",
    posterAlt: "Pool terrace of a Mediterranean-style estate at golden hour, framed by royal palms",
    beats: [{ from: 0.5, to: 0.68, kicker: "Pool & terrace", title: "Clear water. Clean lines.", body: "Skimmed, brushed and checked, every visit." }],
    cta: { label: CTA, href: quote("Property Maintenance"), line: "Your terrace, always guest-ready." },
  },
  {
    id: "chapter-residence",
    manifest: m(residence),
    label: "The Residence",
    service: "Estate & residential cleaning",
    title: "The Residence",
    body: "We surface into light: marble polished to a mirror, linen fresh, every room ready for the family's return.",
    posterAlt: "Sunlit salon with tall arched windows looking out to a clipped garden hedge",
    beats: [{ from: 0.5, to: 0.68, title: "Inside, everything exactly as it should be." }],
    cta: { label: CTA, href: quote("Residential Cleaning"), line: "Ready before you arrive." },
  },
  {
    id: "chapter-glass",
    manifest: m(glass),
    label: "The Glass",
    service: "Window cleaning",
    title: "The Glass",
    body: "Floor-to-ceiling glass, streak-free, so the ocean comes back into the room.",
    posterAlt: "Floor-to-ceiling windows facing the ocean, salt haze being cleared from the glass",
    beats: [{ from: 0.5, to: 0.68, title: "Salt air, cleared away.", body: "Inside and out, down to the frames." }],
    cta: { label: CTA, href: quote("Window Cleaning"), line: "Let the view back in." },
  },
  {
    id: "chapter-grounds",
    manifest: m(grounds),
    label: "The Grounds",
    service: "Pressure washing & grounds",
    title: "The Grounds",
    body: "Weathered stone washes bright again. Hedges clipped, palms groomed, the motor court ready for arrivals.",
    posterAlt: "Stone motor court in front of a two-storey estate, half washed clean",
    beats: [{ from: 0.5, to: 0.68, title: "The right pressure for every surface." }],
    cta: { label: CTA, href: quote("Pressure Washing / Exterior Cleaning"), line: "First impressions, restored." },
  },
  {
    id: "chapter-motor-court",
    manifest: m(foamCannon),
    label: "The Motor Court",
    service: "Auto detailing",
    title: "The Motor Court",
    body: "Snow foam lifts the grime; a gentle rinse reveals a mirror finish.",
    posterAlt: "Dark luxury saloon in a studio, covered in thick white snow foam",
    beats: [{ from: 0.5, to: 0.68, title: "Every panel, by hand." }],
    cta: { label: CTA, href: quote("Auto Detailing"), line: "Detailing, delivered to your driveway." },
  },
];

export function HomeStory() {
  return (
    <>
      <DiveStory
        className="-mt-[72px]"
        chapters={HOME_CHAPTERS}
        skipHref="#after-story"
        theme={{ bg: "#081A2E", ink: "#ffffff", accent: "#C2A06A", ctaClass: "btn-gold", displayClass: "font-display" }}
        hero={{
          kicker: "The Palm Beaches · Private property care",
          title: "Palm Beach homes, impeccably kept.",
          lead: "Estate cleaning, grounds and exterior care, detailing, and private home watch. One discreet team for every detail of your property.",
          actions: (
            <>
              <Link href="/quote" className="btn-gold">
                {CTA}
              </Link>
              <a href={PHONE_TEL} className="btn-ghost-light">
                Call {PHONE_DISPLAY}
              </a>
            </>
          ),
        }}
      />

      <section id="after-story" aria-labelledby="spin-title" className="scroll-mt-20 bg-cream px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy/70">Auto detailing</p>
          <h2 id="spin-title" className="font-display mt-3 text-4xl font-medium text-navy sm:text-6xl">
            Every panel, by hand.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-charcoal/80">
            Turn the car to see the finish from every angle, then switch to the foam stage. Detailing is done at your residence, with
            care for every surface.
          </p>
          <div className="mt-10">
            <SpinViewer manifest={m(carSpin)} labels={{ clean: "Finish", foam: "Foam" }} initial="clean" />
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={quote("Auto Detailing")} className="btn-gold w-full sm:w-auto">
              {CTA}
            </Link>
            <Link href="/services/auto-detailing" className="btn-ghost w-full sm:w-auto">
              Explore detailing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
