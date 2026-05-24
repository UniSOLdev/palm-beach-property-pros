export const LEAD_STATUSES = [
  "new",
  "contacted",
  "quoted",
  "scheduled",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  scheduled: "Scheduled",
  won: "Won",
  lost: "Lost",
};

export function leadStatusClass(status: string): string {
  switch (status) {
    case "new":
      return "bg-sky/60 text-navy";
    case "contacted":
      return "bg-ocean/15 text-ocean";
    case "quoted":
      return "bg-sand/80 text-navy";
    case "scheduled":
      return "bg-leaf/20 text-leaf";
    case "won":
      return "bg-leaf/30 text-navy";
    case "lost":
      return "bg-charcoal/10 text-charcoal/70";
    default:
      return "bg-charcoal/10 text-charcoal";
  }
}
