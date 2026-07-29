import Image from "next/image";
import { HOW_IT_WORKS_STEPS } from "@/lib/homepage-services";
import { getSiteImage } from "@/lib/media/site-imagery";

export function HowItWorksSection() {
  const bg = getSiteImage("section-how-it-works");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-navy/[0.06]">
      {bg ? (
        <div className="absolute inset-0" aria-hidden>
          <Image
            src={bg.filePath}
            alt=""
            fill
            className="object-cover opacity-[0.12]"
            sizes="100vw"
            loading="lazy"
          />
        </div>
      ) : null}
      <ol className="relative grid gap-6 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4 lg:p-8">
        {HOW_IT_WORKS_STEPS.map((step) => (
          <li
            key={step.step}
            className="rounded-2xl border border-navy/[0.08] bg-white/95 p-5 shadow-sm backdrop-blur-sm"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ocean/10 text-sm font-bold text-ocean">
              {step.step}
            </span>
            <h3 className="mt-4 text-base font-semibold text-navy">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
