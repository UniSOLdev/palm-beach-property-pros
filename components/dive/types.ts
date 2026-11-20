import type { ReactNode } from "react";
import type { ExperienceManifest } from "./frames";

/** A caption that fades in and out over part of a chapter's scroll (from/to are 0..1). */
export type DiveBeat = {
  from: number;
  to: number;
  kicker?: string;
  title?: string;
  body?: string;
};

export type DiveChapter = {
  /** anchor id, e.g. "chapter-pool" */
  id: string;
  manifest: ExperienceManifest;
  /** short name for the chapter rail, e.g. "The Pool" */
  label: string;
  /** service line shown in the kicker, e.g. "Pool & outdoor care" */
  service: string;
  title: string;
  body: string;
  /** describes the poster image for screen readers and image search */
  posterAlt: string;
  /** extra captions between the main caption and the closing call to action */
  beats?: DiveBeat[];
  /** closing call to action for this chapter */
  cta: { label: string; href: string; line?: string };
  /** scroll length in viewport heights (desktop); phones use ~72% of it */
  length?: number;
};

/** Brand-level page hero, shown over the first chapter's opening frame (holds the page's H1). */
export type DiveHero = {
  kicker: string;
  title: string;
  lead: string;
  actions: ReactNode;
};

/** Colours and class hooks, so the story can take on any brand. */
export type DiveTheme = {
  /** page/stage background between chapters */
  bg?: string;
  /** headline and body colour over imagery */
  ink?: string;
  /** accent: progress, rail, focus rings */
  accent?: string;
  /** class for primary buttons (default "dive-btn") */
  ctaClass?: string;
  /** class for the display typeface (default "dive-display") */
  displayClass?: string;
};
