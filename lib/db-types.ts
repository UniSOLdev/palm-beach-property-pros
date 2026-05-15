export type QuoteStatus = "draft" | "sent" | "approved" | "converted" | "void";

export type QuoteRow = {
  id: string;
  client_id: string | null;
  service_type: string | null;
  property_address: string | null;
  notes: string | null;
  customer_notes: string | null;
  terms: string | null;
  internal_notes: string | null;
  line_items: InvoiceLineItem[];
  subtotal_cents: number;
  tax_cents: number;
  discount_cents: number;
  deposit_cents: number;
  total_cents: number;
  status: QuoteStatus;
  reference_code: string | null;
  row_version: number;
  created_at: string;
  updated_at: string;
};

export type ClientRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unit_cents: number;
};

export type InvoiceRow = {
  id: string;
  client_id: string | null;
  title: string | null;
  status: string;
  currency: string;
  line_items: InvoiceLineItem[];
  subtotal_cents: number;
  tax_cents: number;
  discount_cents: number;
  deposit_cents: number;
  total_cents: number;
  public_token: string;
  quote_id: string | null;
  quote_reference_code: string | null;
  converted_from_quote_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CrewAssignment = {
  name: string;
  role: string | null;
};

export type JobRow = {
  id: string;
  client_id: string | null;
  title: string;
  status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  row_version: number;
  job_number: string | null;
  service_type: string | null;
  property_address: string | null;
  revenue_cents: number;
  payment_method: string | null;
  quote_id: string | null;
  invoice_id: string | null;
  crew_assignments: CrewAssignment[];
  notes: string | null;
  internal_notes: string | null;
  referral_source: string | null;
  review_requested: boolean;
};

export type JobClientEmbed = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
};

export type JobQuoteEmbed = {
  id: string;
  reference_code: string | null;
  status: string;
  client_id: string | null;
};

export type JobInvoiceEmbed = {
  id: string;
  public_token: string;
  title: string | null;
  status: string;
  client_id: string | null;
};

export type JobDetailPayload = JobRow & {
  clients: JobClientEmbed | null;
  quotes: JobQuoteEmbed | null;
  invoices: JobInvoiceEmbed | null;
};

export type JobListItem = Pick<
  JobRow,
  | "id"
  | "job_number"
  | "title"
  | "status"
  | "client_id"
  | "revenue_cents"
  | "service_type"
  | "created_at"
  | "updated_at"
> & {
  client_name: string | null;
};

export type ExpenseImportBatchRow = {
  id: string;
  label: string | null;
  source: string;
  row_count: number;
  inserted_count: number;
  skipped_duplicates: number;
  skipped_invalid: number;
  reverted_at: string | null;
  created_at: string;
};

export type ExpenseRow = {
  id: string;
  batch_id: string | null;
  expense_date: string;
  client_job_text: string | null;
  job_id: string | null;
  service_type: string | null;
  vendor: string | null;
  item_description: string | null;
  category: string | null;
  amount_cents: number;
  payment_method: string | null;
  expense_type: string | null;
  related_job_text: string | null;
  reimbursable: boolean;
  reimbursed: boolean;
  notes: string | null;
  dedupe_key: string;
  import_meta: Record<string, unknown>;
  created_at: string;
};
