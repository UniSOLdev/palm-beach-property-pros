import { createHash } from "node:crypto";

export type JobMatchRow = {
  id: string;
  title: string | null;
  job_number: string | null;
  client_name: string | null;
};

export type ParsedExpenseInput = {
  expense_date: string | null;
  client_job_text: string | null;
  service_type: string | null;
  vendor: string | null;
  item_description: string | null;
  category: string | null;
  amount_cents: number | null;
  payment_method: string | null;
  expense_type: string | null;
  related_job_text: string | null;
  reimbursable: boolean;
  reimbursed: boolean;
  notes: string | null;
  warnings: string[];
  rowIndex: number;
};

export type ExpensePreviewRow = ParsedExpenseInput & {
  dedupe_key: string;
  job_id: string | null;
  job_match_label: string | null;
  duplicate_in_db: boolean;
  duplicate_in_batch: boolean;
  recurring_hint: boolean;
  valid: boolean;
};

export type ParsedSpreadsheet = {
  headers: string[];
  delimiter: "tab" | "comma";
  unmapped_columns: string[];
  rows: ParsedExpenseInput[];
};

const VENDOR_CATEGORY_RULES: { pattern: RegExp; category: string }[] = [
  { pattern: /home\s*depot|lowes|ace\s*hardware|harbor\s*freight|northern\s*tool/i, category: "Supplies" },
  { pattern: /u-?haul|rental|enterprise|hertz|budget\s*truck/i, category: "Rentals" },
  { pattern: /shell|chevron|bp\s*gas|exxon|mobil|sunoco|wawa\s*gas|gas\s*station/i, category: "Gas" },
  { pattern: /amazon|ebay/i, category: "Supplies" },
  { pattern: /costco|walmart|target|publix|whole\s*foods/i, category: "Supplies" },
  { pattern: /auto\s*zone|advance\s*auto|o'?reilly|napa/i, category: "Vehicle / equipment" },
  { pattern: /chemical|soap|detergent/i, category: "Chemicals" },
];

const PAYMENT_SYNONYMS: { pattern: RegExp; value: string }[] = [
  { pattern: /zelle/i, value: "Zelle" },
  { pattern: /cash/i, value: "Cash" },
  { pattern: /card|credit|debit|visa|mastercard|amex/i, value: "Card" },
  { pattern: /check|cheque/i, value: "Check" },
  { pattern: /venmo|paypal|apple\s*pay/i, value: "Digital" },
];

function normHeader(s: string): string {
  return s
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitDelimited(line: string, delimiter: "\t" | ","): string[] {
  if (delimiter === "\t") {
    return line.split("\t").map((c) => c.trim());
  }
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (!inQ && c === ",") {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out.map((c) => c.replace(/^"|"$/g, ""));
}

function detectDelimiter(headerLine: string): "\t" | "," {
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return tabs >= commas && tabs > 0 ? "\t" : ",";
}

type ColKey =
  | "expense_date"
  | "client_job_text"
  | "service_type"
  | "vendor"
  | "item_description"
  | "category"
  | "amount"
  | "payment_method"
  | "expense_type"
  | "related_job_text"
  | "reimbursable"
  | "reimbursed"
  | "notes";

type ColMap = Partial<Record<ColKey, number>>;

function mapHeaders(headers: string[]): ColMap {
  const map: ColMap = {};
  const n = headers.map(normHeader);

  const find = (pred: (h: string, i: number) => boolean) => n.findIndex(pred);

  const iDate = find((h) =>
    ["date", "transaction date", "expense date"].some((t) => h === t || h.endsWith(" date")),
  );
  if (iDate >= 0) map.expense_date = iDate;

  const iClientJob = find(
    (h) =>
      !h.includes("related") &&
      ["client / job", "client/job", "customer", "client name", "client"].some(
        (t) => h === t || h.startsWith(t),
      ),
  );
  if (iClientJob >= 0) map.client_job_text = iClientJob;

  const iRel = find((h) => h.includes("related job") || h === "job ref" || h === "job id");
  if (iRel >= 0) map.related_job_text = iRel;

  const iSvc = find((h) => h === "service type" || h === "service");
  if (iSvc >= 0) map.service_type = iSvc;

  const iVen = find((h) =>
    ["vendor / store", "vendor", "store", "merchant"].some((t) => h === t || h.startsWith(t)),
  );
  if (iVen >= 0) map.vendor = iVen;

  const iItem = find((h) =>
    ["item / description", "item", "description", "memo line"].some((t) => h === t || h.startsWith(t)),
  );
  if (iItem >= 0) map.item_description = iItem;

  const iCat = find((h) => h === "category" || h === "expense category");
  if (iCat >= 0) map.category = iCat;

  const iAmt = find((h) => ["amount", "cost", "price", "total", "usd"].includes(h));
  if (iAmt >= 0) map.amount = iAmt;

  const iPay = find((h) => h.includes("payment") || h === "pay type");
  if (iPay >= 0) map.payment_method = iPay;

  const iEt = find((h) => h === "expense type" || (h === "type" && !h.includes("service")));
  if (iEt >= 0) map.expense_type = iEt;

  const iReim = find((h) => h.includes("reimbursable"));
  if (iReim >= 0) map.reimbursable = iReim;

  const iReimd = find((h) => h.includes("reimbursed"));
  if (iReimd >= 0) map.reimbursed = iReimd;

  const iNotes = find((h) => h === "notes" || h === "memo" || h === "comment");
  if (iNotes >= 0) map.notes = iNotes;

  return map;
}

export function parseAmountToCents(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).replace(/[$,\s]/g, "").replace(/[()]/g, "");
  if (!s) return null;
  const n = Number.parseFloat(s);
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

export function parseExpenseDate(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    return d.toISOString().slice(0, 10);
  }
  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (mdy) {
    let m = Number(mdy[1]);
    let day = Number(mdy[2]);
    let y = Number(mdy[3]);
    if (y < 100) y += 2000;
    const d = new Date(y, m - 1, day);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

export function inferCategoryFromVendor(vendor: string, existing: string | null): string {
  const cat = (existing ?? "").trim();
  if (cat) return cat;
  const v = vendor.trim();
  if (!v) return "Uncategorized";
  for (const rule of VENDOR_CATEGORY_RULES) {
    if (rule.pattern.test(v)) return rule.category;
  }
  return "Uncategorized";
}

export function inferPaymentMethod(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  for (const rule of PAYMENT_SYNONYMS) {
    if (rule.pattern.test(s)) return rule.value;
  }
  return s;
}

function parseBool(raw: string | null | undefined): boolean {
  if (raw == null) return false;
  const s = String(raw).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1";
}

function cell(row: string[], map: ColMap, key: ColKey): string | null {
  const i = map[key];
  if (i === undefined || i < 0) return null;
  const v = row[i];
  if (v == null) return null;
  const t = String(v).trim();
  return t.length ? t : null;
}

export function parseSpreadsheet(text: string): ParsedSpreadsheet {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
  if (lines.length < 2) {
    return { headers: [], delimiter: "comma", unmapped_columns: [], rows: [] };
  }

  const delimiterChar = detectDelimiter(lines[0]);
  const delimiter: "tab" | "comma" = delimiterChar === "\t" ? "tab" : "comma";
  const headerCells = splitDelimited(lines[0], delimiterChar);
  const headers = headerCells.map((h) => h.trim());
  const hmap = mapHeaders(headers);

  const used = new Set<number>();
  for (const v of Object.values(hmap)) {
    if (typeof v === "number" && v >= 0) used.add(v);
  }
  const unmapped_columns = headers
    .map((h, i) => (used.has(i) ? null : h.trim()))
    .filter((h): h is string => Boolean(h));

  const out: ParsedExpenseInput[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = splitDelimited(lines[r], delimiterChar);
    if (cells.every((c) => !String(c).trim())) continue;

    const warnings: string[] = [];
    const vendor = cell(cells, hmap, "vendor");
    let category = cell(cells, hmap, "category");
    category = inferCategoryFromVendor(vendor ?? "", category);

    const amountRaw = cell(cells, hmap, "amount");
    const amount_cents = parseAmountToCents(amountRaw);
    if (amount_cents == null) warnings.push("Missing or invalid amount");

    const dateRaw = cell(cells, hmap, "expense_date");
    const expense_date = parseExpenseDate(dateRaw);
    if (!expense_date) warnings.push("Missing or ambiguous date");

    const payment_raw = cell(cells, hmap, "payment_method");
    const payment_method = inferPaymentMethod(payment_raw);

    if (hmap.vendor === undefined && vendor) warnings.push("Vendor column not mapped — values may be misaligned");

    out.push({
      expense_date,
      client_job_text: cell(cells, hmap, "client_job_text"),
      service_type: cell(cells, hmap, "service_type"),
      vendor,
      item_description: cell(cells, hmap, "item_description"),
      category,
      amount_cents,
      payment_method,
      expense_type: cell(cells, hmap, "expense_type"),
      related_job_text: cell(cells, hmap, "related_job_text"),
      reimbursable: parseBool(cell(cells, hmap, "reimbursable") ?? ""),
      reimbursed: parseBool(cell(cells, hmap, "reimbursed") ?? ""),
      notes: cell(cells, hmap, "notes"),
      warnings,
      rowIndex: r + 1,
    });
  }
  return { headers, delimiter, unmapped_columns, rows: out };
}

export function buildDedupeKey(input: {
  expense_date: string | null;
  amount_cents: number | null;
  vendor: string | null;
  item_description: string | null;
}): string {
  const date = input.expense_date ?? "";
  const amt = input.amount_cents ?? -1;
  const vendor = (input.vendor ?? "").toLowerCase().trim();
  const desc = (input.item_description ?? "").toLowerCase().trim().slice(0, 160);
  const base = `${date}|${amt}|${vendor}|${desc}`;
  return `h:${createHash("sha256").update(base, "utf8").digest("hex")}`;
}

export function matchJobForRow(
  row: ParsedExpenseInput,
  jobs: JobMatchRow[],
): { job_id: string | null; label: string | null } {
  const hay = [
    row.client_job_text,
    row.related_job_text,
    row.notes,
    row.item_description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!hay.trim()) return { job_id: null, label: null };

  for (const j of jobs) {
    const parts = [j.job_number, j.title, j.client_name].filter(Boolean).map((p) => String(p).toLowerCase());
    for (const p of parts) {
      if (p.length >= 3 && hay.includes(p)) {
        return { job_id: j.id, label: j.job_number ?? j.title ?? j.id.slice(0, 8) };
      }
    }
  }

  return { job_id: null, label: null };
}

export function toPreviewRow(
  row: ParsedExpenseInput,
  jobs: JobMatchRow[],
  flags: { duplicateInDb: boolean; duplicateInBatch: boolean; recurringHint: boolean },
): ExpensePreviewRow {
  const dedupe_key = buildDedupeKey({
    expense_date: row.expense_date,
    amount_cents: row.amount_cents,
    vendor: row.vendor,
    item_description: row.item_description,
  });

  const match = matchJobForRow(row, jobs);
  const job_id = match.job_id;
  const job_match_label = match.label;

  const valid = Boolean(row.expense_date && row.amount_cents != null && row.amount_cents >= 0);

  return {
    ...row,
    dedupe_key,
    job_id,
    job_match_label,
    duplicate_in_db: flags.duplicateInDb,
    duplicate_in_batch: flags.duplicateInBatch,
    recurring_hint: flags.recurringHint,
    valid,
  };
}

export function vendorAmountSignature(vendor: string | null, amount_cents: number | null): string {
  return `${(vendor ?? "").toLowerCase().trim()}|${amount_cents ?? "na"}`;
}
