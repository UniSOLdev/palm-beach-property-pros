import Papa from "papaparse";
import * as XLSX from "xlsx";
import { normalizeReceiptCategory } from "@/lib/admin/receipt-categories";

export type ExpenseImportRow = {
  rowIndex: number;
  expense_date: string;
  vendor: string;
  description: string;
  amount: number;
  category: string;
  payment_method: string;
  notes: string | null;
  errors: string[];
  duplicateHint?: string;
};

export type ExpenseImportParseResult = {
  headers: string[];
  rows: ExpenseImportRow[];
  format: "csv" | "xlsx";
};

const DATE_ALIASES = ["date", "transaction date", "posting date", "expense date", "trans date"];
const VENDOR_ALIASES = ["vendor", "merchant", "payee", "store", "description", "name"];
const AMOUNT_ALIASES = ["amount", "total", "debit", "charge", "payment"];
const DESC_ALIASES = ["description", "memo", "details", "note", "item"];
const CATEGORY_ALIASES = ["category", "type", "expense category"];
const PAYMENT_ALIASES = ["payment method", "payment", "card", "account"];

function normHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function pickColumn(headers: string[], aliases: string[]): string | null {
  const normalized = headers.map((h) => ({ raw: h, norm: normHeader(h) }));
  for (const alias of aliases) {
    const hit = normalized.find((h) => h.norm === alias || h.norm.includes(alias));
    if (hit) return hit.raw;
  }
  return null;
}

function parseAmount(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).replace(/[$,]/g, "").trim();
  const neg = s.startsWith("(") && s.endsWith(")");
  const n = Number(neg ? s.slice(1, -1) : s);
  if (!Number.isFinite(n)) return null;
  return neg ? -Math.abs(n) : n;
}

function parseDate(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") {
    const d = XLSX.SSF.parse_date_code(raw);
    if (d) {
      const iso = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
      return iso;
    }
  }
  const s = String(raw).trim();
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  return null;
}

function inferVendorFromRow(row: Record<string, unknown>, vendorCol: string | null, descCol: string | null): string {
  if (vendorCol && row[vendorCol]) return String(row[vendorCol]).trim();
  if (descCol && row[descCol]) return String(row[descCol]).trim().slice(0, 80);
  return "Unknown vendor";
}

function suggestCategory(vendor: string, description: string): string {
  const text = `${vendor} ${description}`.toLowerCase();
  if (/home depot|lowes|menards|supply/.test(text)) return normalizeReceiptCategory("Supplies");
  if (/shell|chevron|gas|fuel|wawa|speedway/.test(text)) return normalizeReceiptCategory("Gas/Fuel");
  if (/dump|landfill|disposal/.test(text)) return normalizeReceiptCategory("Dump Fees");
  if (/u-haul|rental|home depot truck/.test(text)) return normalizeReceiptCategory("Rentals");
  return normalizeReceiptCategory("Misc");
}

function mapRows(
  records: Record<string, unknown>[],
  headers: string[],
  mapping?: Partial<Record<"date" | "vendor" | "amount" | "description" | "category" | "payment", string>>,
): ExpenseImportRow[] {
  const dateCol = mapping?.date ?? pickColumn(headers, DATE_ALIASES);
  const vendorCol = mapping?.vendor ?? pickColumn(headers, VENDOR_ALIASES);
  const amountCol = mapping?.amount ?? pickColumn(headers, AMOUNT_ALIASES);
  const descCol = mapping?.description ?? pickColumn(headers, DESC_ALIASES);
  const categoryCol = mapping?.category ?? pickColumn(headers, CATEGORY_ALIASES);
  const paymentCol = mapping?.payment ?? pickColumn(headers, PAYMENT_ALIASES);

  return records.map((row, i) => {
    const errors: string[] = [];
    const expense_date = dateCol ? parseDate(row[dateCol]) : null;
    const amountRaw = amountCol ? row[amountCol] : null;
    let amount = parseAmount(amountRaw);
    if (amount != null && amount < 0) amount = Math.abs(amount);

    const vendor = inferVendorFromRow(row, vendorCol, descCol);
    const description =
      descCol && row[descCol] ? String(row[descCol]).trim() : vendor;

    if (!expense_date) errors.push("Missing or invalid date");
    if (amount == null || amount <= 0) errors.push("Missing or invalid amount");

    const category =
      categoryCol && row[categoryCol]
        ? normalizeReceiptCategory(String(row[categoryCol]))
        : suggestCategory(vendor, description);

    const payment_method =
      paymentCol && row[paymentCol] ? String(row[paymentCol]).trim().slice(0, 40) : "Card";

    return {
      rowIndex: i + 1,
      expense_date: expense_date ?? new Date().toISOString().slice(0, 10),
      vendor,
      description: description.slice(0, 200),
      amount: amount ?? 0,
      category,
      payment_method,
      notes: null,
      errors,
    };
  });
}

export function parseExpenseCsv(text: string): ExpenseImportParseResult {
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const headers = parsed.meta.fields ?? [];
  const rows = mapRows(parsed.data, headers);
  return { headers, rows, format: "csv" };
}

export function parseExpenseXlsx(buffer: ArrayBuffer): ExpenseImportParseResult {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const headers =
    records.length > 0
      ? Object.keys(records[0])
      : (XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })[0] as string[] | undefined) ?? [];
  const rows = mapRows(records, headers);
  return { headers, rows, format: "xlsx" };
}

export function detectDuplicateHints(
  rows: ExpenseImportRow[],
  existing: { expense_date: string; vendor: string; amount: number }[],
): ExpenseImportRow[] {
  return rows.map((row) => {
    const dup = existing.find(
      (e) =>
        e.expense_date === row.expense_date &&
        e.vendor.toLowerCase() === row.vendor.toLowerCase() &&
        Math.abs(Number(e.amount) - row.amount) < 0.01,
    );
    if (dup) return { ...row, duplicateHint: "Possible duplicate of existing expense" };
    return row;
  });
}
