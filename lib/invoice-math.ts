import type { InvoiceLineItem } from "@/lib/db-types";

export function sumLineSubtotalCents(items: InvoiceLineItem[]): number {
  return items.reduce((acc, row) => acc + Math.round(row.quantity * row.unit_cents), 0);
}

export function invoiceTotalsFromLines(
  items: InvoiceLineItem[],
  tax_cents: number,
): { subtotal_cents: number; tax_cents: number; total_cents: number } {
  const subtotal_cents = sumLineSubtotalCents(items);
  const total_cents = subtotal_cents + tax_cents;
  return { subtotal_cents, tax_cents, total_cents };
}
