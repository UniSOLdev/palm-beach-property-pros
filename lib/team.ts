/**
 * Owner-facing team copy for the public site.
 * Update photoPath when a team or owner photo is ready in /public/media/team/.
 */

export type TeamValue = {
  title: string;
  body: string;
};

export const TEAM_CONTENT = {
  eyebrow: "Local team",
  headline: "One accountable crew for Palm Beach County properties",
  intro:
    "Palm Beach Property Pros is a locally operated cleaning and property care team. We serve homeowners, property managers, seasonal residents, and businesses who want dependable scheduling, photo-based estimates, and documented results—not vague promises or rotating subcontractors.",
  /** Set when ready, e.g. "/media/team/owner.webp" */
  photoPath: null as string | null,
  photoAlt: "Palm Beach Property Pros team",
  /** Optional — leave empty until you want a name on the About page */
  ownerName: "",
  ownerTitle: "Owner & operator",
  values: [
    {
      title: "Clear communication",
      body: "Scope, pricing, and timing are confirmed before work begins. You know what to expect on service day.",
    },
    {
      title: "Photo-based estimates",
      body: "Photos help us quote accurately and reduce surprises—especially for exterior work, estates, and detailing.",
    },
    {
      title: "Documented results",
      body: "Before-and-after photos when helpful, so owners, managers, and seasonal residents can see what was completed.",
    },
    {
      title: "Local accountability",
      body: "One Palm Beach County team for cleaning, exterior care, recurring maintenance, and mobile detailing.",
    },
  ] satisfies TeamValue[],
} as const;

export function hasTeamPhoto(): boolean {
  return Boolean(TEAM_CONTENT.photoPath);
}
