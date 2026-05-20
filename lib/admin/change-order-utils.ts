import type { ChangeOrderLineInput } from "@/lib/admin/types-change-orders";

export function lineTotal(quantity: number, unitPrice: number) {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function calculateChangeOrderTotals(lines: ChangeOrderLineInput[], taxRate = 0) {
  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l.quantity, l.unit_price), 0);
  const tax_amount = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax_amount) * 100) / 100;
  return { subtotal, tax_amount, total };
}

export function changeOrderPublicUrl(publicId: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.palmbeachpropertypros.com";
  return `${base.replace(/\/$/, "")}/co/${publicId}`;
}
