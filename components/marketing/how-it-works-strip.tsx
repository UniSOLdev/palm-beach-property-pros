import Link from "next/link";
import { ScrollReveal, ScrollRevealItem, ScrollRevealStagger } from "@/components/marketing/scroll-reveal";
import { QUOTE_PATH } from "@/lib/site";

const STEPS = [
  {
    step: "01",
    title: "Tell us what you need",
    body: "Share your address, service type, and photos — takes about two minutes.",
  },
  {
    step: "02",
    title: "Get a written scope",
    body: "We confirm access, materials, and pricing before crews are scheduled.",
  },
  {
    step: "03",
    title: "Crews dispatch",
    body: "Local field teams arrive on time with photo documentation when you want it.",
  },
] as const;

export function HowItWorksStrip() {
  return (
    <section className="section-band-warm mx-auto max-w-6xl px-4 sm:px-6">
      <ScrollReveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow text-ocean">How it works</p>
          <h2 className="section-title mt-3">Simple from quote to completion</h2>
        </div>
      </ScrollReveal>

      <ScrollRevealStagger className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
        {STEPS.map((item) => (
          <ScrollRevealItem key={item.step}>
            <article className="h-full rounded-2xl border border-navy/[0.08] bg-white/90 p-6 shadow-sm">
              <p className="text-[10px] font-bold tracking-[0.35em] text-aqua-muted">{item.step}</p>
              <h3 className="mt-3 text-base font-semibold text-navy">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{item.body}</p>
            </article>
          </ScrollRevealItem>
        ))}
      </ScrollRevealStagger>

      <ScrollReveal delay={60}>
        <p className="mt-8 text-center">
          <Link href={QUOTE_PATH} className="link-luxury">
            Start your quote
          </Link>
        </p>
      </ScrollReveal>
    </section>
  );
}
