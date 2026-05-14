import type { ReactNode } from "react";
import { LocalBusinessJsonLd } from "@/components/json-ld";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { resolveBookingHref, resolveBookingLabel } from "@/lib/booking-settings";
import { getBusinessSettings } from "@/lib/admin/queries";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const settings = await getBusinessSettings();
  const bookingHref = resolveBookingHref(settings);
  const bookingLabel = resolveBookingLabel(settings);

  return (
    <>
      <LocalBusinessJsonLd />
      <SiteHeader bookingHref={bookingHref} bookingLabel={bookingLabel} />
      <main className="mx-auto w-full max-w-6xl px-6 pb-28 pt-6 md:pb-10">{children}</main>
      <SiteFooter />
      <MobileCtaBar bookingHref={bookingHref} bookingLabel={bookingLabel} />
    </>
  );
}
