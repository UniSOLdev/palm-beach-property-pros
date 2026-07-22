/** Shared platform constants — modular foundation for LINKR extraction. */

export const JOB_STATUSES = [
  "Scheduled",
  "On the Way",
  "In Progress",
  "Completed",
  "Invoiced",
  "Cancelled",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_COLORS: Record<string, string> = {
  Scheduled: "bg-sky/60 text-navy",
  "On the Way": "bg-ocean/15 text-ocean",
  "In Progress": "bg-sand/80 text-navy",
  Completed: "bg-leaf/20 text-leaf",
  Invoiced: "bg-leaf/30 text-navy",
  Cancelled: "bg-charcoal/10 text-charcoal/70",
};

export const REVIEW_REQUEST_STATUSES = ["none", "pending", "sent", "completed"] as const;

export type ReviewRequestStatus = (typeof REVIEW_REQUEST_STATUSES)[number];

export function googleMapsDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function phoneTel(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:${digits}` : "#";
}

export function phoneSms(phone: string, body?: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "#";
  return body ? `sms:${digits}?body=${encodeURIComponent(body)}` : `sms:${digits}`;
}
