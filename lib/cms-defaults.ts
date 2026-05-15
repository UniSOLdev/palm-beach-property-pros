import { CTA_LABELS, PBPP_ROUTES } from "@/lib/cta-routes";
import type { CmsHomeSection, CmsSeoPublished, CmsSiteShellPublished } from "@/lib/cms-types";
import { PROPERTY_CARE_PLANS } from "@/lib/service-divisions";
import {
  BRAND_ESSENCE,
  HERO_HEADLINE,
  HERO_SUBHEADLINE,
  PHONE_DISPLAY,
  PHONE_TEL,
  SERVICE_CITIES,
  SITE_NAME,
} from "@/lib/site";

const trustPills = [
  "Licensed & insured",
  "Residential & commercial",
  "Airbnb & turnover specialists",
  "Palm Beach County based",
] as const;

const whoWeWorkWith = [
  "Homeowners",
  "Airbnb hosts",
  "Property managers",
  "Dealerships",
  "Storefronts",
  "HOAs",
  "Seasonal residents",
] as const;

export function cityListComma(): string {
  return SERVICE_CITIES.filter((c) => !c.toLowerCase().startsWith("and nearby")).join(", ");
}

export function defaultHeaderNav(): { label: string; href: string }[] {
  return [
    { href: "/services", label: "Services" },
    { href: "/pricing", label: "Pricing" },
    { href: "/service-area", label: "Service Area" },
    { href: "/quote", label: "Quote" },
  ];
}

export function buildDefaultSiteShellPublished(): CmsSiteShellPublished {
  return {
    header_nav: defaultHeaderNav(),
    quote_button: { label: CTA_LABELS.getFreeQuote, href: PBPP_ROUTES.quote },
    header_call: { label: "Call or Text", href: PHONE_TEL },
    mobile: {
      primary: { label: CTA_LABELS.getFreeQuote, href: PBPP_ROUTES.quote },
      secondary: { label: "Call or Text", href: PHONE_TEL },
    },
    footer_blurb: `${SITE_NAME} delivers premium property operations across Palm Beach County: exterior care, interior care, turnovers, maintenance, and recurring property care plans—licensed, insured, and built for repeat trust.`,
    business_hours:
      "Monday–Saturday, 8 a.m.–6 p.m. (by appointment; hours may vary by season)",
    footer_linkr_caption: CTA_LABELS.footerClientTools,
  };
}

export function buildDefaultSeoPublished(): CmsSeoPublished {
  return {
    home: {
      title: "Premium Property Operations & Care in Palm Beach County",
      description: `${SITE_NAME} — ${HERO_SUBHEADLINE} Licensed & insured. Palm Beach County based.`,
      robots_index: true,
      robots_follow: true,
    },
    services_index: {
      title: "Cleaning & Property Services",
      description: `${SITE_NAME} — window cleaning, pressure washing, residential and commercial cleaning, detailing, carpet care, and maintenance in Palm Beach County. Licensed & insured.`,
      robots_index: true,
      robots_follow: true,
    },
  };
}

export function buildDefaultHomeSections(): CmsHomeSection[] {
  const cityList = cityListComma();

  const carePlans = PROPERTY_CARE_PLANS.map((p) => ({
    name: p.name,
    description: p.description,
    cadence: p.cadence,
    cta: { label: CTA_LABELS.discussPlan, href: PBPP_ROUTES.quote },
  }));

  return [
    {
      id: "hero",
      type: "hero",
      visible: true,
      sortOrder: 10,
      data: {
        brandEssence: BRAND_ESSENCE,
        headline: HERO_HEADLINE,
        subheadline: HERO_SUBHEADLINE,
        trustPills: [...trustPills],
        heroImageUrl:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80",
        primaryCta: { label: CTA_LABELS.getFreeQuote, href: PBPP_ROUTES.quote },
        secondaryCta: { label: `Call or Text ${PHONE_DISPLAY}`, href: PHONE_TEL },
      },
    },
    {
      id: "portal_strip",
      type: "portal_strip",
      visible: true,
      sortOrder: 20,
      data: {
        title: "One secure operations link",
        body: "Quotes, scheduling, invoices, payment, and review requests stay in a single client flow—so nothing gets lost between crews and your property stakeholders.",
        cta: { label: CTA_LABELS.openClientPortal, href: PBPP_ROUTES.clientPortal },
      },
    },
    {
      id: "property_care_plans",
      type: "property_care_plans",
      visible: true,
      sortOrder: 30,
      data: {
        sectionEyebrow: "Property care plans",
        title: "Recurring programs, luxury cadence",
        subtitle:
          'Predictable visits, documented scope, and crews aligned to how your property actually runs—not generic "recurring cleanings."',
        plans: carePlans,
      },
    },
    {
      id: "service_divisions",
      type: "service_divisions",
      visible: true,
      sortOrder: 40,
      data: {
        sectionEyebrow: "Divisions",
        title: "Organized service lines",
        subtitle:
          "Exterior, interior, and property support—structured the way high-trust operators run field programs.",
      },
    },
    {
      id: "who_we_work_with",
      type: "who_we_work_with",
      visible: true,
      sortOrder: 50,
      data: {
        title: "Who we work with",
        body: "From estate driveways to dealership glass lines—one operations mindset: quiet execution, written scope, and repeatability.",
        imageUrl:
          "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Professional property maintenance",
        imageCaption:
          "Crews, equipment, and checklists aligned to coastal substrates and access realities.",
        pills: [...whoWeWorkWith],
      },
    },
    {
      id: "local_service_area",
      type: "local_service_area",
      visible: true,
      sortOrder: 60,
      data: {
        title: "Local operations, county-wide",
        bodyTemplate: `{siteName} runs programs throughout {cityList}, and nearby Palm Beach County areas. Coastal humidity, salt exposure, and seasonal occupancy patterns inform how we schedule exterior refreshes, interior care, and turnovers.`,
        cityListPlaceholder: cityList,
        cta: { label: "View service area →", href: "/service-area" },
      },
    },
    {
      id: "how_it_works",
      type: "how_it_works",
      visible: true,
      sortOrder: 70,
      data: {
        title: "How it works",
        steps: [
          "Request a quote",
          "Share photos & access notes",
          "Receive written scope & schedule",
          "Crew executes to checklist",
        ],
      },
    },
    {
      id: "documentation_trust",
      type: "documentation_trust",
      visible: true,
      sortOrder: 80,
      data: {
        title: "Documentation & trust",
        body: "Larger exterior and commercial scopes can include photo checklists and walkthrough notes so owners and property managers retain a clear record—ask how documentation is handled for your asset class.",
      },
    },
    {
      id: "faq_embed",
      type: "faq_embed",
      visible: true,
      sortOrder: 90,
      data: { title: "FAQ" },
    },
    {
      id: "footer_cta",
      type: "footer_cta",
      visible: true,
      sortOrder: 100,
      data: {
        title: "Ready when you are",
        body: "Same team for quotes, service delivery, invoices, and reviews—organized like modern property operations should be.",
        primaryCta: { label: CTA_LABELS.getFreeQuote, href: PBPP_ROUTES.quote },
        secondaryCta: {
          label: `Call or Text ${PHONE_DISPLAY}`,
          href: PHONE_TEL,
        },
      },
    },
  ];
}

export function homepageCompletionPercent(sections: CmsHomeSection[]): number {
  if (!sections.length) return 0;
  const visible = sections.filter((s) => s.visible).length;
  const base = Math.round((visible / sections.length) * 70);
  const hero = sections.find((s) => s.type === "hero" && s.visible);
  let bonus = 0;
  if (hero && hero.type === "hero") {
    const d = hero.data;
    if (d.headline.trim() && d.subheadline.trim() && d.heroImageUrl.trim()) bonus = 30;
  }
  return Math.min(100, base + bonus);
}
