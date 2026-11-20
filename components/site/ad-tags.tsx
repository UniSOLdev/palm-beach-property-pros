"use client";

/**
 * Meta Pixel + Google tag (GA4 / Google Ads), switched on only when their IDs are set in the
 * environment (Vercel → Settings → Environment Variables):
 *   NEXT_PUBLIC_META_PIXEL_ID          e.g. 123456789012345
 *   NEXT_PUBLIC_GOOGLE_TAG_ID          e.g. G-XXXXXXX or AW-XXXXXXXXX (the gtag.js id)
 *   NEXT_PUBLIC_GOOGLE_ADS_ID          e.g. AW-XXXXXXXXX (optional, if different from the tag id)
 *   NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL  e.g. AW-XXXXXXXXX/AbCdEfGhIj (conversion "send_to" for leads)
 * Scripts load lazily after the page is interactive, so they don't affect LCP.
 * Events: PageView (auto), Lead (quote submitted, via trackLead), Contact (tap on a tel: link).
 */
import Script from "next/script";
import { useEffect } from "react";

const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GTAG = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
const ADS = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

type W = Window & { fbq?: (...a: unknown[]) => void; gtag?: (...a: unknown[]) => void };

export function trackLead(service?: string) {
  const w = window as W;
  w.fbq?.("track", "Lead", service ? { content_name: service } : undefined);
  w.gtag?.("event", "generate_lead", { service: service || "unspecified" });
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL;
  if (label) w.gtag?.("event", "conversion", { send_to: label });
}

export function AdTags() {
  useEffect(() => {
    if (!PIXEL && !GTAG) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="tel:"]');
      if (!a) return;
      const w = window as W;
      w.fbq?.("track", "Contact");
      w.gtag?.("event", "click_to_call");
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return (
    <>
      {PIXEL ? (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL}');fbq('track','PageView');`}
        </Script>
      ) : null}
      {GTAG ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GTAG}`} strategy="lazyOnload" />
          <Script id="gtag-init" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GTAG}');${ADS && ADS !== GTAG ? `gtag('config','${ADS}');` : ""}`}
          </Script>
        </>
      ) : null}
    </>
  );
}
