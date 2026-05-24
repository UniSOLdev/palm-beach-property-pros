export const QUOTE_APPROVAL_STATUSES = ["pending", "viewed", "signed", "declined"] as const;

export type QuoteApprovalStatus = (typeof QUOTE_APPROVAL_STATUSES)[number];

export const QUOTE_APPROVAL_LABELS: Record<QuoteApprovalStatus, string> = {
  pending: "Pending",
  viewed: "Viewed",
  signed: "Signed",
  declined: "Declined",
};

export function quoteApprovalClass(status: QuoteApprovalStatus | string | null | undefined) {
  switch (status) {
    case "signed":
      return "bg-leaf/20 text-navy";
    case "viewed":
      return "bg-sky/50 text-navy";
    case "declined":
      return "bg-red-50 text-red-800";
    default:
      return "bg-sand/80 text-charcoal/80";
  }
}

export const QUOTE_SIGNATURE_LEGAL =
  "I approve this estimate and authorize Palm Beach Property Pros to proceed with the described work according to the terms above.";

export const SIGNED_DOCUMENTS_BUCKET = "signed-documents";
