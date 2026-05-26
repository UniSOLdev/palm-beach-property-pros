/** Media source lifecycle — swap scaffold entries with authentic PBPP assets over time. */
export type MediaSource = "scaffold" | "authentic" | "video";

export type MediaCategory =
  | "hero"
  | "exterior"
  | "interior"
  | "property-support"
  | "transformation"
  | "walkthrough"
  | "documentation"
  | "local";

export type MediaAspect = "hero" | "landscape" | "portrait" | "square" | "wide";

export type MediaOverlay = "cinematic" | "card" | "subtle" | "none";

export type MediaAsset = {
  id: string;
  category: MediaCategory;
  /** Remote URL, `/public` path, or future CDN path. */
  src: string;
  alt: string;
  source: MediaSource;
  /** Optional future video / reel / drone clip. */
  videoSrc?: string;
  posterSrc?: string;
  focal?: string;
  aspect?: MediaAspect;
  overlay?: MediaOverlay;
  /** Editorial note for internal swaps — not rendered publicly. */
  swapNote?: string;
  location?: string;
  blurDataURL?: string;
};

export type TransformationProject = {
  id: string;
  title: string;
  location: string;
  division: "exterior" | "interior" | "property-support";
  timeframe: string;
  summary: string;
  scope: readonly string[];
  before: MediaAsset;
  after: MediaAsset;
  /** When true, show scaffold disclosure badge. */
  isScaffold: boolean;
};

export type ProjectRecap = {
  id: string;
  title: string;
  location: string;
  division: string;
  duration: string;
  handled: readonly string[];
  image: MediaAsset;
  isScaffold: boolean;
};

export type OperationalProof = {
  id: string;
  title: string;
  description: string;
  icon: "checklist" | "report" | "photos" | "scope" | "log" | "portal";
};

export type FieldStep = {
  id: string;
  label: string;
  detail: string;
};
