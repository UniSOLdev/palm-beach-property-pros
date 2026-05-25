import {
  normalizePaymentMethod,
  normalizeReceiptCategory,
  type ReceiptExpenseCategory,
} from "@/lib/admin/receipt-categories";

export type ReceiptExtractionResult = {
  vendor: string;
  expense_date: string;
  amount: number;
  tax_amount: number | null;
  subtotal: number | null;
  payment_method: string;
  card_last4: string | null;
  category: ReceiptExpenseCategory;
  description: string;
  notes: string | null;
  confidence: number;
  raw_text: string | null;
  extraction_method: "openai" | "unavailable";
  error_message: string | null;
};

const EXTRACTION_SCHEMA = {
  vendor: "store or merchant name",
  expense_date: "YYYY-MM-DD transaction date",
  amount: "total amount paid as number",
  tax_amount: "tax amount if visible or null",
  subtotal: "subtotal before tax if visible or null",
  payment_method: "e.g. Visa, Cash, Card — never full card number",
  card_last4: "last 4 digits only if visible, else null",
  category: "one of: Chemicals, Gas/Fuel, Equipment, Tools, Rentals, Dump Fees, Labor, Marketing, Software, Supplies, Repairs, Storage, Vehicle, PPE, Meals, Misc",
  description: "short expense description",
  notes: "any extra line items or memo, null if none",
  confidence: "0 to 1 how confident you are in the extraction",
  raw_text: "brief summary of key visible text on receipt",
};

export async function extractReceiptFromImageUrl(imageUrl: string): Promise<ReceiptExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return emptyExtraction("Receipt scanning is not configured (missing OPENAI_API_KEY). Enter details manually.");
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_RECEIPT_MODEL?.trim() || "gpt-4.1-mini",
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You extract structured data from receipt photos for a property services business. Return only valid JSON. Never include full credit card numbers — last 4 digits only if visible. If unsure, lower confidence and use best guess.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract these fields as JSON keys: ${JSON.stringify(EXTRACTION_SCHEMA)}`,
              },
              {
                type: "image_url",
                image_url: { url: imageUrl, detail: "high" },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      return emptyExtraction(`Scan failed (${res.status}). Enter details manually.`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return emptyExtraction("No extraction result. Enter details manually.");

    const parsed = JSON.parse(content) as Record<string, unknown>;
    return normalizeParsed(parsed);
  } catch {
    return emptyExtraction("Could not read receipt. Enter details manually.");
  }
}

function normalizeParsed(parsed: Record<string, unknown>): ReceiptExtractionResult {
  const amount = parseMoney(parsed.amount) ?? 0;
  const tax = parseMoney(parsed.tax_amount);
  const subtotal = parseMoney(parsed.subtotal);
  const last4 = sanitizeLast4(parsed.card_last4);
  const confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5));
  const vendor = String(parsed.vendor ?? "Unknown vendor").trim().slice(0, 120);
  const expense_date = normalizeDate(String(parsed.expense_date ?? ""));
  const category = normalizeReceiptCategory(String(parsed.category ?? ""));
  const description = String(parsed.description ?? vendor).trim().slice(0, 200) || vendor;
  const notesParts: string[] = [];
  if (tax != null) notesParts.push(`Tax: $${tax.toFixed(2)}`);
  if (subtotal != null) notesParts.push(`Subtotal: $${subtotal.toFixed(2)}`);
  if (last4) notesParts.push(`Card •••• ${last4}`);
  const extraNotes = parsed.notes ? String(parsed.notes).trim() : "";
  if (extraNotes) notesParts.push(extraNotes);

  return {
    vendor,
    expense_date,
    amount,
    tax_amount: tax,
    subtotal,
    payment_method: normalizePaymentMethod(String(parsed.payment_method ?? "")),
    card_last4: last4,
    category,
    description,
    notes: notesParts.length ? notesParts.join(" · ") : null,
    confidence,
    raw_text: parsed.raw_text ? String(parsed.raw_text).slice(0, 500) : null,
    extraction_method: "openai",
    error_message: null,
  };
}

function emptyExtraction(message: string): ReceiptExtractionResult {
  const today = new Date().toISOString().slice(0, 10);
  return {
    vendor: "",
    expense_date: today,
    amount: 0,
    tax_amount: null,
    subtotal: null,
    payment_method: "Card",
    card_last4: null,
    category: "Misc",
    description: "",
    notes: null,
    confidence: 0,
    raw_text: null,
    extraction_method: "unavailable",
    error_message: message,
  };
}

function parseMoney(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[$,]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function sanitizeLast4(v: unknown): string | null {
  if (v == null) return null;
  const digits = String(v).replace(/\D/g, "").slice(-4);
  return digits.length === 4 ? digits : null;
}

function normalizeDate(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}
