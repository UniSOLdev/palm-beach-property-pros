import { PHONE_DISPLAY, SITE_NAME, SITE_URL } from "@/lib/site";

export function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    url: SITE_URL,
    telephone: PHONE_DISPLAY,
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Palm Beach County, Florida",
    },
    description:
      "Property restoration, cleaning, and maintenance for residential and commercial properties in Palm Beach County. Exterior and interior field work — no carpentry.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
