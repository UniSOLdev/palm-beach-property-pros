import Image from "next/image";

/** Photographic header for inner pages. */
export function PageHero({
  eyebrow,
  title,
  lead,
  image,
  imageAlt,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  image: string;
  imageAlt: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative -mt-[72px] overflow-hidden bg-navy-deep text-cream">
      <Image src={image} alt={imageAlt} fill priority quality={60} sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,26,46,0.8)_0%,rgba(8,26,46,0.45)_45%,rgba(8,26,46,0.85)_100%)]" />
      <div className="site-container relative flex min-h-[62svh] flex-col justify-end pb-14 pt-36 sm:min-h-[68svh] sm:pb-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-light">{eyebrow}</p>
        <h1 className="font-display mt-4 max-w-4xl text-5xl font-medium leading-[1.04] sm:text-7xl">{title}</h1>
        {lead ? <p className="mt-6 max-w-2xl text-lg leading-relaxed text-cream/90 sm:text-xl">{lead}</p> : null}
        {children ? <div className="mt-9 flex flex-col gap-3 sm:flex-row">{children}</div> : null}
      </div>
    </section>
  );
}
