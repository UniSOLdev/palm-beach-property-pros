import { CATALOG, type CatalogService } from "@/lib/site/catalog";
import { FAQS, SERVICE_AREAS, type FaqItem } from "@/lib/site/content";
import { PHONE_DISPLAY, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here: content is static and contains no "</script".
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const areaServed = [
  ...SERVICE_AREAS.map((a) => ({ "@type": "City", name: `${a.name}, FL` })),
  ...["West Palm Beach", "Juno Beach", "Riviera Beach", "Lake Worth Beach", "Boynton Beach", "Delray Beach"].map((n) => ({ "@type": "City", name: `${n}, FL` })),
  { "@type": "AdministrativeArea", name: "Palm Beach County, FL" },
];

/** Site-wide LocalBusiness. Service-area business: no street address published (discretion). */
export function LocalBusinessJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": `${SITE_URL}/#business`,
        name: SITE_NAME,
        legalName: "Palm Beach Property Pros LLC",
        url: SITE_URL,
        image: `${SITE_URL}/photos/og.jpg`,
        logo: `${SITE_URL}/brand/pbpp-monogram.png`,
        telephone: `+1-${PHONE_DISPLAY}`,
        description: SITE_DESCRIPTION,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Palm Beach Gardens",
          addressRegion: "FL",
          addressCountry: "US",
        },
        areaServed,
        knowsAbout: CATALOG.map((s) => s.name),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Property care services",
          itemListElement: CATALOG.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.name, url: `${SITE_URL}/services/${s.slug}` },
          })),
        },
      }}
    />
  );
}

export function FaqJsonLd({ items = FAQS }: { items?: FaqItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }}
    />
  );
}

export function ServiceJsonLd({ service }: { service: CatalogService }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name: service.name,
        serviceType: service.name,
        description: service.summary,
        url: `${SITE_URL}/services/${service.slug}`,
        provider: { "@id": `${SITE_URL}/#business` },
        areaServed,
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: `${SITE_URL}${it.path}`,
        })),
      }}
    />
  );
}
