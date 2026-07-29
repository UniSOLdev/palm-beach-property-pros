import Image from "next/image";
import Link from "next/link";
import { CTA } from "@/lib/cta";
import { getSiteImage } from "@/lib/media/site-imagery";
import { PHONE_DISPLAY, PHONE_TEL, QUOTE_PATH } from "@/lib/site";

type EstimateCtaProps = {
  title?: string;
  body?: string;
  className?: string;
  /** Use stock decorative background from site imagery inventory */
  withBackground?: boolean;
};

export function EstimateCta({
  title = "Ready for a clear estimate?",
  body = "Share photos and property details—we will call or text you to confirm scope and next steps.",
  className = "",
  withBackground = false,
}: EstimateCtaProps) {
  const bg = withBackground ? getSiteImage("section-final-cta") : null;

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] px-4 py-14 text-center text-cream shadow-luxury sm:px-8 md:rounded-3xl md:py-16 ${
        withBackground ? "" : "bg-gradient-to-b from-charcoal to-navy-deep"
      } ${className}`}
    >
      {bg ? (
        <>
          <Image
            src={bg.filePath}
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/85 via-navy/80 to-navy-deep/90" aria-hidden />
        </>
      ) : (
        <div className="absolute inset-0 bg-luxury-vignette opacity-70" aria-hidden />
      )}
      <div className="relative">
        <h2 className="section-title text-cream">{title}</h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-silver/90">{body}</p>
        <div className="mx-auto mt-8 flex w-full max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link href={QUOTE_PATH} className="btn-hero-primary min-h-[52px] w-full sm:w-auto">
            {CTA.primaryEstimate}
          </Link>
          <a href={PHONE_TEL} className="btn-hero-secondary min-h-[52px] w-full sm:w-auto">
            {CTA.callOrText} {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}
