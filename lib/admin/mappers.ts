import type {
  BusinessSettings,
  Client,
  ClientType,
  CrewMember,
  CrewPayout,
  Expense,
  ExpenseCategory,
  ExpenseType,
  Invoice,
  InvoiceLineItem,
  InvoicePaymentStatus,
  Job,
  JobStatus,
  PaymentMethod,
  Quote,
  QuoteLineItem,
  QuoteStatus,
  ReviewRequestStatus,
  SopChecklistItem,
  SopTemplate,
  Supply,
  SupplyCategory,
} from "./types";

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return fallback;
}

function str(v: unknown, fallback = ""): string {
  return v == null ? fallback : String(v);
}

function isoDate(v: unknown): string {
  if (!v) return new Date().toISOString().slice(0, 10);
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function isoDateTime(v: unknown): string {
  if (!v) return new Date().toISOString();
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

export function mapClientRow(row: Record<string, unknown>): Client {
  return {
    id: str(row.id),
    name: str(row.name),
    phone: str(row.phone),
    email: str(row.email),
    address: str(row.address),
    clientType: str(row.client_type, "Residential") as ClientType,
    referralSource: str(row.referral_source),
    notes: str(row.notes),
    followUpDate: row.follow_up_date ? isoDate(row.follow_up_date) : null,
    reviewStatus: str(row.review_status, "Not sent") as ReviewRequestStatus,
    createdAt: isoDateTime(row.created_at),
  };
}

export function mapJobRow(row: Record<string, unknown>, jobExpenseTotal?: number): Job {
  const crew = Array.isArray(row.assigned_crew_ids)
    ? (row.assigned_crew_ids as unknown[]).map((x) => str(x))
    : [];
  return {
    id: str(row.id),
    clientId: str(row.client_id),
    serviceType: str(row.service_type),
    address: str(row.address),
    date: isoDate(row.job_date),
    startTime: str(row.start_time),
    endTime: str(row.end_time),
    status: str(row.status, "Lead") as JobStatus,
    assignedCrewIds: crew,
    jobNotes: str(row.job_notes),
    internalNotes: str(row.internal_notes),
    beforePhotoUrls: Array.isArray(row.before_photo_urls) ? (row.before_photo_urls as string[]) : [],
    afterPhotoUrls: Array.isArray(row.after_photo_urls) ? (row.after_photo_urls as string[]) : [],
    quoteId: row.quote_id ? str(row.quote_id) : null,
    invoiceId: row.invoice_id ? str(row.invoice_id) : null,
    revenue: num(row.revenue),
    jobExpenseTotal: typeof jobExpenseTotal === "number" ? jobExpenseTotal : num(row.job_expense_total),
    paymentMethod: row.payment_method ? (str(row.payment_method) as PaymentMethod) : null,
    reviewRequested: Boolean(row.review_requested),
    referralSource: str(row.referral_source),
    createdAt: isoDateTime(row.created_at),
  };
}

export function mapQuoteRow(
  row: Record<string, unknown>,
  items: { id: string; description: string; quantity: number; unit_price: number; is_addon: boolean; sort_order: number }[],
): Quote {
  const lineItems: QuoteLineItem[] = [];
  const optionalAddons: QuoteLineItem[] = [];
  for (const it of [...items].sort((a, b) => num(a.sort_order) - num(b.sort_order))) {
    const li: QuoteLineItem = {
      id: str(it.id),
      description: str(it.description),
      quantity: num(it.quantity, 1),
      unitPrice: num(it.unit_price),
      isAddon: Boolean(it.is_addon),
    };
    if (it.is_addon) optionalAddons.push(li);
    else lineItems.push(li);
  }
  return {
    id: str(row.id),
    publicId: str(row.public_id),
    quoteNumber: str(row.quote_number),
    clientId: str(row.client_id),
    jobAddress: str(row.job_address),
    serviceType: str(row.service_type),
    lineItems,
    optionalAddons,
    notes: str(row.notes),
    terms: str(row.terms),
    expirationDate: row.expiration_date ? isoDate(row.expiration_date) : isoDate(new Date()),
    status: str(row.status, "Draft") as QuoteStatus,
    depositRequired: Boolean(row.deposit_required),
    depositAmount: num(row.deposit_amount),
    internalNotes: str(row.internal_notes),
    createdAt: isoDateTime(row.created_at),
    invoiceId: row.invoice_id ? str(row.invoice_id) : null,
  };
}

export function mapInvoiceRow(
  row: Record<string, unknown>,
  items: { id: string; description: string; quantity: number; unit_price: number; sort_order: number }[],
): Invoice {
  const lineItems: InvoiceLineItem[] = [...items]
    .sort((a, b) => num(a.sort_order) - num(b.sort_order))
    .map((it) => ({
      id: str(it.id),
      description: str(it.description),
      quantity: num(it.quantity, 1),
      unitPrice: num(it.unit_price),
    }));
  return {
    id: str(row.id),
    publicId: str(row.public_id),
    invoiceNumber: str(row.invoice_number),
    clientId: str(row.client_id),
    jobId: row.job_id ? str(row.job_id) : null,
    quoteId: row.quote_id ? str(row.quote_id) : null,
    lineItems,
    discount: num(row.discount),
    depositPaid: num(row.deposit_paid),
    paymentStatus: str(row.payment_status, "Unpaid") as InvoicePaymentStatus,
    paymentMethod: row.payment_method ? (str(row.payment_method) as PaymentMethod) : null,
    paidDate: row.paid_date ? isoDate(row.paid_date) : null,
    notes: str(row.notes),
    terms: str(row.terms),
    reviewRequestStatus: str(row.review_request_status, "Not sent") as ReviewRequestStatus,
    dueDate: row.due_date ? isoDate(row.due_date) : isoDate(new Date()),
    createdAt: isoDateTime(row.created_at),
  };
}

export function mapExpenseRow(row: Record<string, unknown>): Expense {
  return {
    id: str(row.id),
    date: isoDate(row.expense_date),
    category: str(row.category, "Miscellaneous") as ExpenseCategory,
    vendor: str(row.vendor),
    description: str(row.description),
    amount: num(row.amount),
    paymentMethod: str(row.payment_method, "Other") as PaymentMethod,
    jobId: row.job_id ? str(row.job_id) : null,
    receiptUrl: row.receipt_url ? str(row.receipt_url) : null,
    expenseType: str(row.expense_type, "Overhead") as ExpenseType,
    reimbursable: Boolean(row.reimbursable),
    reimbursed: Boolean(row.reimbursed),
    notes: str(row.notes),
    createdAt: isoDateTime(row.created_at),
  };
}

export function mapSupplyRow(row: Record<string, unknown>): Supply {
  return {
    id: str(row.id),
    name: str(row.name),
    category: str(row.category, "Misc.") as SupplyCategory,
    quantity: num(row.quantity),
    unit: str(row.unit),
    storageLocation: str(row.storage_location),
    reorderLevel: num(row.reorder_level),
    cost: num(row.cost),
    vendor: str(row.vendor),
    notes: str(row.notes),
  };
}

export function mapCrewMemberRow(row: Record<string, unknown>): CrewMember {
  const unit = str(row.pay_rate_unit, "hour");
  return {
    id: str(row.id),
    name: str(row.name),
    phone: str(row.phone),
    role: str(row.role),
    defaultPayRate: num(row.default_pay_rate),
    payRateUnit: unit === "job" || unit === "percent" ? unit : "hour",
    notes: str(row.notes),
  };
}

export function mapCrewPayoutRow(row: Record<string, unknown>): CrewPayout {
  const crewIds = Array.isArray(row.crew_member_ids)
    ? (row.crew_member_ids as unknown[]).map((x) => str(x))
    : [];
  const payTypeRaw = str(row.pay_type, "hourly");
  const payType =
    payTypeRaw === "flat rate" || payTypeRaw === "percentage" ? (payTypeRaw as CrewPayout["payType"]) : "hourly";
  return {
    id: str(row.id),
    jobId: str(row.job_id),
    crewMemberIds: crewIds,
    payType,
    hours: row.hours == null ? null : num(row.hours),
    percent: row.percent == null ? null : num(row.percent),
    flatAmount: row.flat_amount == null ? null : num(row.flat_amount),
    calculatedTotal: num(row.calculated_total),
    createdAt: isoDateTime(row.created_at),
  };
}

export function mapBusinessSettingsRow(row: Record<string, unknown>): BusinessSettings {
  const methods = Array.isArray(row.payment_methods_accepted)
    ? (row.payment_methods_accepted as unknown[]).map((m) => str(m) as PaymentMethod)
    : (["Cash", "Zelle", "Card", "Check"] as PaymentMethod[]);
  return {
    id: row.id ? str(row.id) : undefined,
    businessName: str(row.business_name, "Palm Beach Property Pros"),
    phone: str(row.phone),
    email: str(row.email),
    website: str(row.website),
    logoUrl: row.logo_url ? str(row.logo_url) : null,
    address: str(row.address),
    googleReviewUrl: str(row.google_review_url),
    defaultInvoiceTerms: str(row.default_invoice_terms),
    defaultQuoteTerms: str(row.default_quote_terms),
    paymentMethodsAccepted: methods.length ? methods : (["Cash", "Zelle", "Card", "Check"] as PaymentMethod[]),
    brandPrimary: str(row.brand_primary, "#0C2340"),
    brandAccent: str(row.brand_accent, "#6A8F6B"),
  };
}

type ChecklistSectionRow = { section: string; items: unknown; sort_order: number };

export function mapSopTemplateFromRows(
  templateRow: Record<string, unknown>,
  checklistRows: ChecklistSectionRow[],
): SopTemplate {
  const bySection = (name: string): SopChecklistItem[] => {
    const row = checklistRows.find((r) => r.section === name);
    if (!row || !Array.isArray(row.items)) return [];
    return (row.items as { id?: string; label?: string }[]).map((it, idx) => ({
      id: str(it.id, `${name}_${idx}`),
      label: str(it.label, "Item"),
    }));
  };

  const supplies = Array.isArray(templateRow.supplies_needed)
    ? (templateRow.supplies_needed as unknown[]).map((s) => str(s))
    : [];
  const roles = Array.isArray(templateRow.crew_roles)
    ? (templateRow.crew_roles as unknown[]).map((s) => str(s))
    : [];

  return {
    id: str(templateRow.id),
    slug: str(templateRow.slug),
    title: str(templateRow.title),
    estimatedMinutes: num(templateRow.estimated_minutes, 0),
    suppliesNeeded: supplies,
    steps: bySection("steps"),
    crewRoles: roles.length ? roles : ["Lead", "Technician"],
    qualityControl: bySection("quality_control"),
    photoChecklist: bySection("photo_checklist"),
    completion: bySection("completion"),
  };
}
