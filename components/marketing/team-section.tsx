import Image from "next/image";
import Link from "next/link";
import { TEAM_CONTENT } from "@/lib/team";

export function TeamSection({ compact = false }: { compact?: boolean }) {
  const { eyebrow, headline, intro, photoPath, photoAlt, values } = TEAM_CONTENT;

  return (
    <section className={compact ? "" : "py-16 md:py-24"} aria-labelledby="team-heading">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
        <div
          className={`relative overflow-hidden rounded-2xl border border-navy/[0.08] bg-gradient-to-br from-sky/40 to-cream-warm shadow-sm ${
            compact ? "aspect-[4/3] max-h-[320px]" : "aspect-[4/3] lg:aspect-auto lg:min-h-[420px]"
          }`}
        >
          {photoPath ? (
            <Image
              src={photoPath}
              alt={photoAlt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          ) : (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ocean/80">
                Team photo
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-charcoal/65">
                Owner and crew photos coming soon—your completed project photos will appear in our
                work sections first.
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="section-eyebrow text-ocean">{eyebrow}</p>
          <h2 id="team-heading" className="section-title mt-4">
            {headline}
          </h2>
          <p className="section-lead mt-4 text-left">{intro}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {values.map((value) => (
              <li
                key={value.title}
                className="rounded-xl border border-navy/[0.08] bg-white/80 px-4 py-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-navy">{value.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-charcoal/75">{value.body}</p>
              </li>
            ))}
          </ul>
          {!compact ? (
            <p className="mt-8">
              <Link href="/about" className="link-luxury text-sm">
                Learn more about our team →
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
