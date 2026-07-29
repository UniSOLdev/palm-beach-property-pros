/**
 * Published project case studies. Only include projects with real photos and copy.
 * Homepage shows a concise preview; full detail lives on dedicated pages.
 */

export type CaseStudy = {
  slug: string;
  title: string;
  city: string;
  serviceType: string;
  summary: string;
  initialCondition: string;
  scopeOfWork: string[];
  challenges: string[];
  workCompleted: string[];
  results: string;
  completionTimeline?: string;
  customerQuote?: string;
  /** Paths relative to /public */
  beforeImage?: string;
  afterImage?: string;
  beforeAlt?: string;
  afterAlt?: string;
  published: boolean;
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "estate-cleanup-palm-beach-gardens",
    title: "Estate Vegetation Cleanup & Exterior Restoration",
    city: "Palm Beach Gardens",
    serviceType: "Property cleanup & estate care",
    summary:
      "Overgrown vegetation, blocked pathways, and exterior lines restored across a Palm Beach Gardens estate in a focused multi-day cleanup.",
    initialCondition:
      "Dense overgrowth had overtaken walkways, landscape beds, and sight lines around the home. Debris and vegetation made paths difficult to navigate and left the property looking neglected.",
    scopeOfWork: [
      "Vegetation trimming and removal",
      "Pathway clearing",
      "Debris haul-off",
      "Landscape bed refinement",
      "Exterior line restoration",
    ],
    challenges: [
      "Heavy overgrowth required staged clearing to protect existing hardscape",
      "Multiple elevation changes around the property",
      "Coordinated debris removal without disrupting neighboring landscaping",
    ],
    workCompleted: [
      "Cleared overgrown vegetation from primary walkways and entry paths",
      "Removed accumulated debris and trimmed back encroaching plant material",
      "Refined landscape beds and restored clean exterior sight lines",
      "Documented before-and-after conditions with photos throughout",
    ],
    results:
      "Walkways are clear, exterior lines are restored, and the property presents cleanly for owners and guests. Before-and-after photos document the full transformation.",
    completionTimeline: "48-hour estate turnaround",
    beforeImage: "/media/curated/estate-cleanup-001/images/before-img-7699.webp",
    afterImage: "/media/curated/estate-cleanup-001/images/after-img-7714.webp",
    beforeAlt: "Before — overgrown estate pathways in Palm Beach Gardens",
    afterAlt: "After — cleared estate pathways in Palm Beach Gardens",
    published: true,
  },
];

export function getPublishedCaseStudies(): CaseStudy[] {
  return CASE_STUDIES.filter((c) => c.published);
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.slug === slug && c.published);
}
