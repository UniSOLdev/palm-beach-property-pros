import type { PublicQuoteItem } from "@/lib/quotes/types";

export function calculateQuoteTotals(items: PublicQuoteItem[]) {
  const lineItems = items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const lineTotal = quantity * unitPrice;
    return { ...item, quantity, unitPrice, lineTotal };
  });

  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  // Quotes table has no tax fields — total equals subtotal unless extended later.
  const tax = 0;
  const total = subtotal + tax;

  return { lineItems, subtotal, tax, total };
}

export function formatLineAmount(amount: number) {
  if (amount === 0) return "TBD";
  return amount;
}
