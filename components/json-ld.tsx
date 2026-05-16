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
      "Premium Palm Beach County property operations: exterior care, interior care, turnovers, maintenance, and recurring property care plans with licensed, insured crews.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
