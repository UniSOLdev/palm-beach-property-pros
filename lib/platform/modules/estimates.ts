import type { PublicQuoteItem } from "@/lib/quotes/types";

export type QuoteLineInput = {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  sort_order?: number;
};

export type QuoteEstimateInput = {
  client_id: string;
  service_type: string;
  job_address: string;
  notes?: string | null;
  internal_notes?: string | null;
  terms?: string | null;
  expiration_date?: string | null;
  deposit_required?: boolean;
  deposit_amount?: number;
  discount_type?: "percent" | "fixed" | null;
  discount_value?: number;
  tax_rate?: number;
  lines: QuoteLineInput[];
};

export function calculateEstimateTotals(
  lines: QuoteLineInput[],
  options?: {
    discount_type?: "percent" | "fixed" | null;
    discount_value?: number;
    tax_rate?: number;
  },
) {
  const subtotal = lines.reduce(
    (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unit_price) || 0),
    0,
  );

  let discount = 0;
  const discountType = options?.discount_type;
  const discountValue = Number(options?.discount_value ?? 0);

  if (discountType === "percent" && discountValue > 0) {
    discount = subtotal * (Math.min(discountValue, 100) / 100);
  } else if (discountType === "fixed" && discountValue > 0) {
    discount = Math.min(discountValue, subtotal);
  }

  const afterDiscount = Math.max(0, subtotal - discount);
  const taxRate = Number(options?.tax_rate ?? 0);
  const tax = afterDiscount * (taxRate / 100);
  const total = afterDiscount + tax;

  return { subtotal, discount, tax, total };
}

export function mapQuoteItems(items: PublicQuoteItem[]): QuoteLineInput[] {
  return items.map((item, index) => ({
    id: item.id,
    description: item.description,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    sort_order: item.sort_order ?? index,
  }));
}
