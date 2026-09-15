export const PROSPECT_TYPES = [
  "property_manager",
  "str_manager",
  "landlord",
  "hoa",
  "commercial",
] as const;

export type ProspectType = (typeof PROSPECT_TYPES)[number];

export const PROSPECT_TYPE_LABELS: Record<ProspectType, string> = {
  property_manager: "Property manager",
  str_manager: "Airbnb / STR",
  landlord: "Landlord",
  hoa: "HOA",
  commercial: "Commercial",
};

export const PROSPECT_STATUSES = [
  "new",
  "contacted",
  "callback",
  "meeting",
  "vendor_approved",
  "won",
  "lost",
] as const;

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  new: "New",
  contacted: "Contacted",
  callback: "Callback",
  meeting: "Meeting",
  vendor_approved: "Vendor approved",
  won: "Won",
  lost: "Lost",
};

export function prospectStatusClass(status: string): string {
  switch (status) {
    case "new":
      return "bg-sky/60 text-navy";
    case "contacted":
      return "bg-ocean/15 text-ocean";
    case "callback":
      return "bg-sand/80 text-navy";
    case "meeting":
      return "bg-leaf/20 text-leaf";
    case "vendor_approved":
      return "bg-leaf/30 text-navy";
    case "won":
      return "bg-navy text-white";
    case "lost":
      return "bg-charcoal/10 text-charcoal/70";
    default:
      return "bg-charcoal/10 text-charcoal";
  }
}

export const PROSPECT_PITCH_SNIPPET =
  "Local vendor (33407) — bi-weekly yard, move-out cleans, pressure wash, windows. Subcontract or portfolio rate. Photo documentation on every job.";
