"use client";

import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef, useState } from "react";
import { PROPERTY_SEGMENTS } from "@/lib/marketing/property-segments";
import { QUOTE_PATH } from "@/lib/site";

function HouseFace({
  transform,
  className,
  children,
  active,
}: {
  transform: string;
  className?: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <div
      className={`absolute flex h-[140px] w-[200px] items-stretch justify-stretch border border-white/20 shadow-xl transition-shadow duration-500 ${
        active ? "shadow-glow-soft ring-2 ring-aqua/50" : ""
      } ${className ?? ""}`}
      style={{ transform }}
    >
      {children}
    </div>
  );
}

function PropertyHouse3D({
  rotateY,
  activeIndex,
}: {
  rotateY: MotionValue<number>;
  activeIndex: number;
}) {
  const smoothRotate = useSpring(rotateY, { stiffness: 90, damping: 28, mass: 0.8 });

  return (
    <div className="property-scene mx-auto flex h-[280px] w-full max-w-md items-center justify-center sm:h-[320px]">
      <motion.div
        className="property-house relative h-[140px] w-[200px]"
        style={{
          rotateY: smoothRotate,
          transformStyle: "preserve-3d",
        }}
      >
        <HouseFace transform="translateZ(100px)" active={activeIndex === 0} className="bg-gradient-to-b from-emerald-700/90 to-emerald-900/95">
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-sm">
            <div className="h-[45%] bg-gradient-to-b from-sky-300/80 to-sky-400/60" />
            <div className="flex flex-1 flex-col justify-end bg-gradient-to-t from-emerald-800 to-emerald-600/90 p-3">
              <div className="h-2 w-full rounded-full bg-emerald-400/40" />
              <div className="mt-2 h-10 w-8 rounded-sm bg-cream/90" />
              <p className="mt-auto text-[9px] font-bold uppercase tracking-widest text-emerald-100/90">
                Front yard
              </p>
            </div>
          </div>
        </HouseFace>

        <HouseFace transform="rotateY(90deg) translateZ(100px)" active={activeIndex === 1} className="bg-gradient-to-br from-sky-100 to-sky-200/90">
          <div className="flex h-full w-full flex-col gap-2 p-4">
            <div className="flex-1 rounded-sm bg-sky-300/50 ring-1 ring-white/40" />
            <div className="h-12 rounded-sm bg-sky-300/40 ring-1 ring-white/30" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-navy/70">Window lines</p>
          </div>
        </HouseFace>

        <HouseFace transform="rotateY(180deg) translateZ(100px)" active={activeIndex === 2} className="bg-gradient-to-b from-cream to-cream-warm/90">
          <div className="flex h-full w-full flex-col p-4">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded bg-navy/10" />
              <div className="h-3 w-1/2 rounded bg-navy/10" />
              <div className="h-8 w-full rounded bg-aqua/20" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-navy/60">Interior</p>
          </div>
        </HouseFace>

        <HouseFace transform="rotateY(270deg) translateZ(100px)" active={activeIndex === 3} className="bg-gradient-to-b from-amber-900/30 to-charcoal/80">
          <div className="relative flex h-full w-full flex-col justify-end p-3">
            <div className="absolute left-3 top-3 h-8 w-12 rounded bg-charcoal/40" />
            <div className="absolute right-4 top-6 h-6 w-10 rounded bg-charcoal/30" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-cream/70">Debris zone</p>
          </div>
        </HouseFace>

        <div
          className="absolute h-[140px] w-[200px] bg-gradient-to-b from-navy to-navy-deep"
          style={{ transform: "rotateX(90deg) translateZ(0px)", transformOrigin: "center bottom" }}
        />
        <div
          className="absolute h-[140px] w-[200px] bg-navy-deep/90"
          style={{ transform: "rotateX(-90deg) translateZ(0px)", transformOrigin: "center top" }}
        />
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cream via-cream/80 to-transparent" />
    </div>
  );
}

function SegmentPanel({ index }: { index: number }) {
  const segment = PROPERTY_SEGMENTS[index] ?? PROPERTY_SEGMENTS[0]!;

  return (
    <motion.div
      key={segment.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-aqua-muted">{segment.zone}</p>
      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-navy">{segment.name}</h3>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-charcoal/75">{segment.tagline}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/services/${segment.slug}`} className="btn-secondary min-h-[44px] px-5 text-sm">
          Learn more
        </Link>
        <Link href={QUOTE_PATH} className="btn-primary min-h-[44px] px-5 text-sm">
          Get a quote
        </Link>
      </div>
    </motion.div>
  );
}

function StaticPropertyExplorer() {
  const [index, setIndex] = useState(0);
  const segment = PROPERTY_SEGMENTS[index]!;

  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="section-eyebrow text-ocean">Your property</p>
        <h2 className="section-title mt-3">Restore, clean, maintain</h2>
      </div>
      <div className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-2">
        {PROPERTY_SEGMENTS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              i === index ? "border-ocean bg-sky/40 text-navy" : "border-navy/12 bg-white text-charcoal/70"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-md text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-aqua-muted">{segment.zone}</p>
        <h3 className="mt-2 text-xl font-semibold text-navy">{segment.name}</h3>
        <p className="mt-2 text-sm text-charcoal/75">{segment.tagline}</p>
        <Link href={QUOTE_PATH} className="btn-primary mt-6 inline-flex min-h-[44px]">
          Get a quote
        </Link>
      </div>
    </section>
  );
}

export function PropertyScrollExplorer() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const rotateY = useTransform(scrollYProgress, [0, 1], [0, 360]);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const idx = Math.min(PROPERTY_SEGMENTS.length - 1, Math.floor(p * PROPERTY_SEGMENTS.length));
    setActiveIndex(idx);
  });

  if (reduce) return <StaticPropertyExplorer />;

  return (
    <section ref={sectionRef} className="relative h-[320vh] md:h-[280vh]" aria-label="Property services explorer">
      <div className="sticky top-0 flex h-[100dvh] min-h-[560px] items-center overflow-hidden bg-gradient-to-b from-cream via-cream to-cream-warm/30">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
          <div className="order-2 lg:order-1">
            <p className="section-eyebrow text-ocean">Your property</p>
            <h2 className="section-title mt-3">Scroll to explore each zone</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-charcoal/70">
              Restoration, cleaning, and maintenance — residential and commercial. Scroll to see
              each zone we handle (no carpentry).
            </p>
            <div className="mt-6 hidden gap-2 lg:flex lg:flex-col">
              {PROPERTY_SEGMENTS.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition duration-300 ${
                    i === activeIndex
                      ? "border-ocean/40 bg-white shadow-sm"
                      : "border-transparent text-charcoal/45"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${i === activeIndex ? "bg-ocean" : "bg-navy/15"}`}
                  />
                  {s.zone}
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <PropertyHouse3D rotateY={rotateY} activeIndex={activeIndex} />
            <div className="mt-6 lg:mt-10">
              <SegmentPanel index={activeIndex} />
            </div>
            <p className="mt-6 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/40 lg:text-left">
              Scroll to rotate
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
