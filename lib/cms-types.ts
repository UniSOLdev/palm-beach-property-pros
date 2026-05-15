/** CMS JSON contracts — homepage sections, site shell, theme, SEO map. */

export type CmsCtaInline = {
  label: string;
  href: string;
  external?: boolean;
};

export type CmsHomeHeroData = {
  brandEssence: string;
  headline: string;
  subheadline: string;
  trustPills: string[];
  heroImageUrl: string;
  primaryCta: CmsCtaInline;
  secondaryCta: CmsCtaInline;
};

export type CmsHomePortalStripData = {
  title: string;
  body: string;
  cta: CmsCtaInline;
};

export type CmsHomeCarePlansData = {
  sectionEyebrow: string;
  title: string;
  subtitle: string;
  plans: { name: string; description: string; cadence: string; cta: CmsCtaInline }[];
};

export type CmsHomeDivisionsData = {
  sectionEyebrow: string;
  title: string;
  subtitle: string;
};

export type CmsHomeWhoWeWorkWithData = {
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
  imageCaption?: string;
  pills: string[];
};

export type CmsHomeLocalAreaData = {
  title: string;
  bodyTemplate: string;
  /** Uses {cityList} token */
  cityListPlaceholder: string;
  cta: CmsCtaInline;
};

export type CmsHomeHowItWorksData = {
  title: string;
  steps: string[];
};

export type CmsHomeDocTrustData = {
  title: string;
  body: string;
};

export type CmsHomeFooterCtaData = {
  title: string;
  body: string;
  primaryCta: CmsCtaInline;
  secondaryCta: CmsCtaInline;
};

export type CmsHomeSectionBase = { id: string; visible: boolean; sortOrder: number };

export type CmsHomeSection =
  | (CmsHomeSectionBase & { type: "hero"; data: CmsHomeHeroData })
  | (CmsHomeSectionBase & { type: "portal_strip"; data: CmsHomePortalStripData })
  | (CmsHomeSectionBase & { type: "property_care_plans"; data: CmsHomeCarePlansData })
  | (CmsHomeSectionBase & { type: "service_divisions"; data: CmsHomeDivisionsData })
  | (CmsHomeSectionBase & { type: "who_we_work_with"; data: CmsHomeWhoWeWorkWithData })
  | (CmsHomeSectionBase & { type: "local_service_area"; data: CmsHomeLocalAreaData })
  | (CmsHomeSectionBase & { type: "how_it_works"; data: CmsHomeHowItWorksData })
  | (CmsHomeSectionBase & { type: "documentation_trust"; data: CmsHomeDocTrustData })
  | (CmsHomeSectionBase & { type: "faq_embed"; data: { title: string } })
  | (CmsHomeSectionBase & { type: "footer_cta"; data: CmsHomeFooterCtaData });

export type CmsNavLink = {
  label: string;
  href: string;
};

export type CmsSiteShellPublished = {
  header_nav?: CmsNavLink[];
  quote_button?: CmsCtaInline;
  header_call?: CmsCtaInline;
  mobile?: { primary: CmsCtaInline; secondary: CmsCtaInline };
  footer_blurb?: string;
  business_hours?: string;
  footer_linkr_caption?: string;
};

export type CmsThemePublished = {
  logo_url?: string | null;
  favicon_url?: string | null;
  hero_overlay_opacity?: number;
  primary_hex?: string | null;
  accent_hex?: string | null;
  font_preset?: "inter" | "system";
};

export type CmsSeoEntry = {
  title?: string;
  description?: string;
  og_image_url?: string | null;
  keywords?: string[];
  canonical_path?: string | null;
  robots_index?: boolean;
  robots_follow?: boolean;
};

export type CmsSeoPublished = Record<string, CmsSeoEntry>;

export type CmsServiceOverlay = Partial<{
  name: string;
  shortDescription: string;
  bestFor: string;
  headline: string;
  authorityIntro: string;
  included: string[];
  whoItsFor: string[];
  process: string[];
  startingPriceLabel: string;
  faq: { q: string; a: string }[];
}>;

export type MarketingRuntime = {
  shell: CmsSiteShellPublished | null;
  theme: CmsThemePublished | null;
};
