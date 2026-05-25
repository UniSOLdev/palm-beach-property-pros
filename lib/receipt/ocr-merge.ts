import { normalizeReceiptCategory } from "@/lib/admin/receipt-categories";
import type { OcrParseResult } from "@/lib/receipt/ocr";

/** Merge multi-page PDF (or multi-image) OCR into one receipt. */
export function mergeOcrResults(results: OcrParseResult[]): OcrParseResult {
  if (results.length === 1) return results[0];

  const warnings = new Set<string>();
  warnings.add(`Combined ${results.length} page scan(s).`);
  for (const r of results) r.warnings.forEach((w) => warnings.add(w));

  const withTotal = results.filter((r) => r.total > 0);
  const primary = withTotal.length
    ? withTotal.reduce((best, r) => (r.total >= best.total ? r : best))
    : results.reduce((best, r) => (r.confidence >= best.confidence ? r : best));

  const vendor =
    results.map((r) => r.vendor.trim()).find((v) => v.length > 0) ?? primary.vendor;

  const date =
    results.map((r) => r.date).find((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)) ?? primary.date;

  const receipt_number =
    results.map((r) => r.receipt_number.trim()).find((n) => n.length > 0) ?? primary.receipt_number;

  const line_items = results.flatMap((r) => r.line_items);
  const notesParts = results.map((r) => r.notes.trim()).filter(Boolean);
  const uniqueNotes = [...new Set(notesParts)];

  const subtotal = Math.max(...results.map((r) => r.subtotal), 0);
  const tax = Math.max(...results.map((r) => r.tax), 0);
  const total = Math.max(...results.map((r) => r.total), 0);

  const confidence =
    results.reduce((s, r) => s + r.confidence, 0) / Math.max(results.length, 1);

  const category = normalizeReceiptCategory(
    primary.suggested_category ||
      results.map((r) => r.suggested_category).find((c) => c && c !== "Misc") ||
      "Misc",
  );

  const card_last4 = results.map((r) => r.card_last4).find((c) => c) ?? primary.card_last4;

  return {
    vendor,
    date,
    total,
    subtotal: subtotal || primary.subtotal,
    tax: tax || primary.tax,
    payment_method: primary.payment_method || results[0].payment_method,
    card_last4,
    receipt_number,
    suggested_category: category,
    notes: uniqueNotes.join(" · "),
    line_items,
    confidence,
    raw: primary.raw,
    warnings: [...warnings],
    ocr_version: primary.ocr_version,
    model: primary.model,
  };
}
