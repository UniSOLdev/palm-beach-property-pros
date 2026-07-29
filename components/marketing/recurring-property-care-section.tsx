import Image from "next/image";
import Link from "next/link";
import { RECURRING_CARE_PROGRAMS } from "@/lib/homepage-services";
import { CTA } from "@/lib/cta";
import { getSiteImage } from "@/lib/media/site-imagery";
import { QUOTE_PATH } from "@/lib/site";

export function RecurringPropertyCareSection() {
  const image = getSiteImage("section-recurring-care");

  return (
    <section className="relative overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-sm">
      <div className="grid lg:grid-cols-2 lg:items-center">
        {image ? (
          <div className="relative aspect-[16/10] min-h-[220px] lg:aspect-auto lg:min-h-[420px]">
            <Image
              src={image.filePath}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
            />
          </div>
        ) : null}
        <div className="p-6 md:p-10">
          <p className="section-eyebrow text-ocean">Recurring property care</p>
          <h2 className="section-title mt-3">Programs that keep your property ready</h2>
          <p className="mt-4 text-sm leading-relaxed text-charcoal/75 md:text-base">
            From weekly home cleaning to seasonal estate support and vacation-home checks—choose a
            cadence that fits how your property is used.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {RECURRING_CARE_PROGRAMS.map((program) => (
              <li key={program.title} className="rounded-xl border border-navy/[0.06] bg-sand/20 p-4">
                <h3 className="text-sm font-semibold text-navy">{program.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-charcoal/70">{program.body}</p>
              </li>
            ))}
          </ul>
          <Link href={QUOTE_PATH} className="btn-primary mt-8 inline-flex">
            {CTA.requestEstimate}
          </Link>
        </div>
      </div>
    </section>
  );
}
