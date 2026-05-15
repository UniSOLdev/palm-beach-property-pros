import type { InvoiceLineItem } from "@/lib/db-types";

export function sumLineSubtotalCents(items: InvoiceLineItem[]): number {
  return items.reduce((acc, row) => acc + Math.round(row.quantity * row.unit_cents), 0);
}

/** Line subtotal + tax (no discount). */
export function invoiceTotalsFromLines(
  items: InvoiceLineItem[],
  tax_cents: number,
): { subtotal_cents: number; tax_cents: number; total_cents: number } {
  const subtotal_cents = sumLineSubtotalCents(items);
  const tax = Math.max(0, Math.round(tax_cents));
  const total_cents = subtotal_cents + tax;
  return { subtotal_cents, tax_cents: tax, total_cents };
}

/** Authoritative totals for quotes and invoices with discounts (discount applied before tax). */
export function totalsWithDiscount(
  items: InvoiceLineItem[],
  tax_cents: number,
  discount_cents: number,
): {
  subtotal_cents: number;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
} {
  const subtotal_cents = sumLineSubtotalCents(items);
  const rawDisc = Math.max(0, Math.round(discount_cents));
  const discount_applied = Math.min(rawDisc, subtotal_cents);
  const after_discount = subtotal_cents - discount_applied;
  const tax = Math.max(0, Math.round(tax_cents));
  const total_cents = after_discount + tax;
  return {
    subtotal_cents,
    tax_cents: tax,
    discount_cents: discount_applied,
    total_cents,
  };
}
