import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { SERVICE_CITIES } from "@/lib/site";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";

const STREET_SUFFIX =
  /\b(st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|way|ct|court|pl|place|cir|circle|hwy|highway)\b/i;
const STREET_NUMBER = /\b\d{1,6}\s+\w+/;
const ZIP_CODE = /\b\d{5}(?:-\d{4})?\b/;

const SERVICE_KEYWORDS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bpressure\s*wash/i, label: "Pressure Washing / Exterior" },
  { pattern: /\bwindow\s*clean/i, label: "Window Cleaning" },
  { pattern: /\bmove[\s-]?out|turnover|rental\s*clean/i, label: "Move-Out & Turnover Cleaning" },
  { pattern: /\byard|landscape|lawn|mow|hedge/i, label: "Yard & Landscape Maintenance" },
  { pattern: /\bdebris|cleanout|haul|junk|trash\s*removal/i, label: "Trash & Debris Removal" },
  { pattern: /\bcarpet|steam\s*clean/i, label: "Carpet & Steam Cleaning" },
  { pattern: /\bresidential\s*clean/i, label: "Residential Cleaning" },
  { pattern: /\bcommercial\s*clean/i, label: "Commercial Cleaning" },
  { pattern: /\bmaintenance|property\s*care/i, label: "Property Maintenance" },
  { pattern: /\bairbnb|co[\s-]?host|str\b/i, label: "Airbnb / Co-host Services" },
  { pattern: /\bclean/i, label: "Residential Cleaning" },
  { pattern: /\brestor/i, label: "Property Maintenance" },
];

export type ParsedSmsLead = {
  address: string | null;
  serviceRequested: string | null;
  city: string | null;
  name: string | null;
  message: string;
};

export type CreateLeadFromSmsResult =
  | { ok: true; quoteRequestId: string }
  | { ok: false; error: string };

function normalizePhone(from: string): string {
  const digits = from.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  return from.trim();
}

function detectCity(text: string): string | null {
  const lower = text.toLowerCase();
  for (const city of SERVICE_CITIES) {
    if (city === "and nearby Palm Beach County areas") continue;
    if (lower.includes(city.toLowerCase())) return city;
  }
  return null;
}

/** Heuristic parse of address-like segments from free-form SMS. */
export function extractAddressLikeText(message: string): string | null {
  const text = message.trim();
  if (!text) return null;

  const lines = text
    .split(/[\n;]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const hasStreet = STREET_NUMBER.test(line) && STREET_SUFFIX.test(line);
    const hasZip = ZIP_CODE.test(line);
    const hasCity = detectCity(line) !== null;
    if (hasStreet || (hasZip && line.length >= 8) || (hasStreet && hasCity)) {
      return line.slice(0, 500);
    }
  }

  const inlineMatch = text.match(
    /\d{1,6}\s+[\w\s.'-]{2,40}(?:st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|way|ct|court)\.?[\w\s,.'-]*/i,
  );
  if (inlineMatch) return inlineMatch[0].trim().slice(0, 500);

  if (ZIP_CODE.test(text) && text.length >= 10) {
    return text.slice(0, 500);
  }

  return null;
}

/** Detect a service need from SMS keywords. */
export function extractServiceNeed(message: string): string | null {
  for (const { pattern, label } of SERVICE_KEYWORDS) {
    if (pattern.test(message)) return label;
  }
  return null;
}

function extractName(message: string): string | null {
  const match = message.match(/\b(?:i'?m|i am|this is|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  return match?.[1]?.trim() ?? null;
}

/** Parse SMS body for lead fields. */
export function parseSmsForLead(message: string): ParsedSmsLead {
  return {
    address: extractAddressLikeText(message),
    serviceRequested: extractServiceNeed(message),
    city: detectCity(message),
    name: extractName(message),
    message: message.trim(),
  };
}

export function smsHasLeadSignals(parsed: ParsedSmsLead): boolean {
  return Boolean(parsed.address && parsed.serviceRequested);
}

/** Insert quote_request from parsed inbound SMS. */
export async function createLeadFromSms(
  fromNumber: string,
  message: string,
  parsed: ParsedSmsLead = parseSmsForLead(message),
): Promise<CreateLeadFromSmsResult> {
  if (!parsed.address || !parsed.serviceRequested) {
    return { ok: false, error: "Missing address or service need" };
  }

  const supabase = createServiceClient();
  const phone = normalizePhone(fromNumber);

  const row = {
    name: parsed.name?.trim() || "SMS Contact",
    phone,
    email: null,
    service_requested: parsed.serviceRequested,
    address: parsed.address,
    city: parsed.city,
    property_type: null,
    message: parsed.message || null,
    preferred_contact: "Text",
    preferred_date: null,
    preferred_time: null,
    source: "receptionist_sms",
    referrer: null,
    status: "new",
    photo_urls: [] as string[],
  };

  const { data, error } = await supabase.from("quote_requests").insert(row).select("id").single();

  if (error || !data) {
    logPipelineError("receptionist SMS lead insert failed", error ?? new Error("No row"), {
      step: "createLeadFromSms",
      details: { phone, service: parsed.serviceRequested },
    });
    return { ok: false, error: error?.message ?? "Insert failed" };
  }

  logPipelineInfo("receptionist SMS lead created", {
    step: "createLeadFromSms",
    leadId: data.id,
    details: { phone, service: parsed.serviceRequested },
  });

  return { ok: true, quoteRequestId: data.id };
}
