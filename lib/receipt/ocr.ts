import {
  normalizePaymentMethod,
  normalizeReceiptCategory,
  suggestCategoryFromVendor,
} from "@/lib/admin/receipt-categories";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";
import { ReceiptScanError } from "@/lib/receipt/errors";
import type { ReceiptLineItem } from "@/lib/receipt/scan-types";
import { OCR_MODEL, OCR_VERSION } from "@/lib/receipt/scan-types";

const OCR_TIMEOUT_MS = 45_000;

const EXTRACTION_PROMPT = `Extract receipt data for a property services field crew. Return JSON only with these keys:
vendor (string), date (YYYY-MM-DD), total (number), subtotal (number or 0), tax (number or 0),
payment_method (string), card_last4 (string or null), receipt_number (string),
suggested_category (one of: Gas/Fuel, Equipment, Tools, Rentals, Dump Fees, Labor, Marketing, Software, Supplies, Repairs, Storage, Vehicle, PPE, Meals, Misc),
notes (string), line_items (array of {description, amount, quantity?}), confidence (0-1 number).
Never include full card numbers. If unreadable, return best partial guess with low confidence.`;

type RawOcr = {
  vendor?: string;
  date?: string;
  total?: number;
  subtotal?: number;
  tax?: number;
  payment_method?: string;
  card_last4?: string | null;
  receipt_number?: string;
  suggested_category?: string;
  notes?: string;
  line_items?: { description?: string; amount?: number; quantity?: number }[];
  confidence?: number;
};

export type OcrParseResult = {
  vendor: string;
  date: string;
  total: number;
  subtotal: number;
  tax: number;
  payment_method: string;
  card_last4: string | null;
  receipt_number: string;
  suggested_category: string;
  notes: string;
  line_items: ReceiptLineItem[];
  confidence: number;
  raw: RawOcr;
  warnings: string[];
  ocr_version: string;
  model: string;
};

export async function runReceiptOcr(imageDataUrl: string): Promise<OcrParseResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new ReceiptScanError(
      "CONFIG",
      "Receipt scanning is not configured. Enter details manually.",
      503,
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OCR_MODEL,
        temperature: 0.1,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a receipt OCR assistant for Palm Beach Property Pros. Return valid JSON only. Partial extraction is preferred over refusing.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACTION_PROMPT },
              { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logPipelineError("receipt OCR HTTP error", new Error(`${res.status} ${body.slice(0, 200)}`), {
        step: "runReceiptOcr",
      });
      return partialOcrFromFailure(`OCR service returned ${res.status}. Review fields manually.`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return partialOcrFromFailure("No OCR content returned.");

    const parsed = JSON.parse(content) as RawOcr;
    return normalizeOcr(parsed);
  } catch (err) {
    if (err instanceof ReceiptScanError) throw err;
    const aborted = err instanceof Error && err.name === "AbortError";
    logPipelineError("receipt OCR exception", err, { step: "runReceiptOcr" });
    return partialOcrFromFailure(
      aborted ? "Scan timed out. Review and edit fields manually." : "Could not complete OCR.",
    );
  } finally {
    clearTimeout(timer);
  }
}

function partialOcrFromFailure(warning: string): OcrParseResult {
  const today = new Date().toISOString().slice(0, 10);
  logPipelineInfo("receipt OCR partial fallback", { step: "runReceiptOcr", details: { warning } });
  return {
    vendor: "",
    date: today,
    total: 0,
    subtotal: 0,
    tax: 0,
    payment_method: "Card",
    card_last4: null,
    receipt_number: "",
    suggested_category: "Misc",
    notes: "",
    line_items: [],
    confidence: 0.15,
    raw: {},
    warnings: [warning],
    ocr_version: OCR_VERSION,
    model: OCR_MODEL,
  };
}

function normalizeOcr(parsed: RawOcr): OcrParseResult {
  const vendor = String(parsed.vendor ?? "").trim().slice(0, 120);
  const date = normalizeDate(String(parsed.date ?? ""));
  const total = parseMoney(parsed.total) ?? 0;
  const subtotal = parseMoney(parsed.subtotal) ?? 0;
  const tax = parseMoney(parsed.tax) ?? 0;
  const confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5));
  const category = parsed.suggested_category?.trim()
    ? normalizeReceiptCategory(parsed.suggested_category)
    : suggestCategoryFromVendor(vendor);

  const line_items: ReceiptLineItem[] = Array.isArray(parsed.line_items)
    ? parsed.line_items
        .map((li) => ({
          description: String(li.description ?? "").trim().slice(0, 120),
          amount: parseMoney(li.amount) ?? 0,
          quantity: li.quantity != null ? Number(li.quantity) : undefined,
        }))
        .filter((li) => li.description || li.amount > 0)
    : [];

  const warnings: string[] = [];
  if (confidence < 0.45) warnings.push("Low scan confidence — please verify all fields.");
  else if (confidence < 0.75) warnings.push("Medium confidence — review amounts and date.");
  if (!vendor) warnings.push("Vendor not detected.");
  if (total <= 0) warnings.push("Total not detected — enter amount manually.");

  const notesParts: string[] = [];
  if (parsed.notes) notesParts.push(String(parsed.notes).trim());
  const last4 = sanitizeLast4(parsed.card_last4);
  if (last4) notesParts.push(`Card •••• ${last4}`);

  return {
    vendor,
    date,
    total,
    subtotal,
    tax,
    payment_method: normalizePaymentMethod(String(parsed.payment_method ?? "")),
    card_last4: last4,
    receipt_number: String(parsed.receipt_number ?? "").trim().slice(0, 64),
    suggested_category: category,
    notes: notesParts.join(" · "),
    line_items,
    confidence,
    raw: parsed,
    warnings,
    ocr_version: OCR_VERSION,
    model: OCR_MODEL,
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
