import type { Invoice } from "./types";
import { sumLineItems } from "./format";

export function invoiceSubtotal(inv: Invoice) {
  return Math.max(0, sumLineItems(inv.lineItems) - inv.discount);
}

export function invoiceBalanceDue(inv: Invoice) {
  return Math.max(0, invoiceSubtotal(inv) - inv.depositPaid);
}
