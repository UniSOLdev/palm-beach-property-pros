export const CHANGE_ORDER_STATUSES = ["draft", "sent", "approved", "declined", "void"] as const;
export type ChangeOrderStatus = (typeof CHANGE_ORDER_STATUSES)[number];

export const APPROVAL_TERMS_VERSION = "1.0";

export const APPROVAL_LEGAL_TEXT =
  "I understand and approve the additional scope of work, pricing, and terms listed above. I authorize Palm Beach Property Pros to proceed with this change order.";

export const CHANGE_ORDER_WORKFLOW_SHORTCUTS = {
  created: { title: "Send change order approval link", category: "Job Follow-Up" as const },
  sent: { title: "Follow up on unsigned change order", category: "Job Follow-Up" as const },
  approved: { title: "Add approved change order to invoice", category: "Invoice Follow-Up" as const },
} as const;

export function changeOrderStatusClass(status: string) {
  switch (status) {
    case "approved":
      return "bg-leaf/20 text-navy";
    case "sent":
      return "bg-sky/60 text-navy";
    case "declined":
      return "bg-red-100 text-red-800";
    case "void":
      return "bg-neutral-200 text-charcoal";
    default:
      return "bg-sand/80 text-navy";
  }
}
