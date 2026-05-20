/** PBPP expense categories for receipt scanner + expense forms */
export const RECEIPT_EXPENSE_CATEGORIES = [
  "Chemicals",
  "Gas/Fuel",
  "Equipment",
  "Tools",
  "Rentals",
  "Dump Fees",
  "Labor",
  "Marketing",
  "Software",
  "Supplies",
  "Repairs",
  "Storage",
  "Vehicle",
  "PPE",
  "Misc",
] as const;

export type ReceiptExpenseCategory = (typeof RECEIPT_EXPENSE_CATEGORIES)[number];

const LEGACY_MAP: Record<string, ReceiptExpenseCategory> = {
  Fuel: "Gas/Fuel",
  "Truck Rental": "Rentals",
  Meals: "Misc",
  Supplies: "Supplies",
  Chemicals: "Chemicals",
  Equipment: "Equipment",
  "Dump Fees": "Dump Fees",
  Labor: "Labor",
  Marketing: "Marketing",
  Software: "Software",
};

export function normalizeReceiptCategory(raw: string | null | undefined): ReceiptExpenseCategory {
  if (!raw?.trim()) return "Misc";
  const t = raw.trim();
  if ((RECEIPT_EXPENSE_CATEGORIES as readonly string[]).includes(t)) return t as ReceiptExpenseCategory;
  const legacy = LEGACY_MAP[t];
  if (legacy) return legacy;
  const lower = t.toLowerCase();
  if (/fuel|gas|shell|chevron|wawa|sunoco/i.test(lower)) return "Gas/Fuel";
  if (/chemical|bleach|chlor/i.test(lower)) return "Chemicals";
  if (/home depot|lowes|harbor freight|tool/i.test(lower)) return "Tools";
  if (/dump|landfill|disposal/i.test(lower)) return "Dump Fees";
  if (/rental|u-haul|home depot truck/i.test(lower)) return "Rentals";
  if (/ppe|glove|mask|safety/i.test(lower)) return "PPE";
  if (/repair|service/i.test(lower)) return "Repairs";
  if (/storage|unit/i.test(lower)) return "Storage";
  if (/vehicle|auto|tire/i.test(lower)) return "Vehicle";
  return "Misc";
}

export function normalizePaymentMethod(raw: string | null | undefined): string {
  if (!raw?.trim()) return "Card";
  const t = raw.trim().toLowerCase();
  if (/cash/.test(t)) return "Cash";
  if (/zelle/.test(t)) return "Zelle";
  if (/venmo/.test(t)) return "Venmo";
  if (/check/.test(t)) return "Check";
  if (/debit|credit|card|visa|master|amex|discover/.test(t)) return "Card";
  return "Other";
}
