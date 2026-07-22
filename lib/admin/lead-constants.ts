export const LEAD_STATUSES = [
  "new",
  "contacted",
  "site_visit_scheduled",
  "estimate_sent",
  "approved",
  "scheduled",
  "completed",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  site_visit_scheduled: "Site Visit Scheduled",
  estimate_sent: "Estimate Sent",
  approved: "Approved",
  scheduled: "Scheduled",
  completed: "Completed",
  lost: "Lost",
};

/** Statuses that need owner follow-up */
export const LEAD_FOLLOWUP_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "site_visit_scheduled",
  "estimate_sent",
  "approved",
];

export const WATER_SPIGOT_LABELS: Record<string, string> = {
  yes: "Yes — accessible exterior spigot available",
  no: "No — no accessible exterior spigot",
  unsure: "Unsure",
};

export function leadStatusClass(status: string): string {
  switch (status) {
    case "new":
      return "bg-sky/60 text-navy";
    case "contacted":
      return "bg-ocean/15 text-ocean";
    case "site_visit_scheduled":
      return "bg-sand/80 text-navy";
    case "estimate_sent":
      return "bg-sand/80 text-navy";
    case "approved":
      return "bg-leaf/20 text-leaf";
    case "scheduled":
      return "bg-leaf/20 text-leaf";
    case "completed":
      return "bg-leaf/30 text-navy";
    case "lost":
      return "bg-charcoal/10 text-charcoal/70";
    // Legacy mappings for display
    case "quoted":
      return "bg-sand/80 text-navy";
    case "won":
      return "bg-leaf/30 text-navy";
    default:
      return "bg-charcoal/10 text-charcoal";
  }
}

export function normalizeLeadStatus(status: string): LeadStatus {
  if (status === "quoted") return "estimate_sent";
  if (status === "won") return "completed";
  if ((LEAD_STATUSES as readonly string[]).includes(status)) return status as LeadStatus;
  return "new";
}
