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
  invoice_number: string | null;
  service_address: string | null;
  prepared_by: string;
  issue_date: string | null;
  due_date: string | null;
  scope_notes: string | null;
  client_message: string | null;
  revision_number: number;
  soft_deleted_at: string | null;
  created_at: string;
  updated_at: string;
};


export type InvoicePaymentRow = {
  id: string;
  invoice_id: string;
  payment_date: string;
  method: "cash" | "zelle" | "card" | "check" | "venmo" | "other";
  description: string | null;
  amount_cents: number;
  reference: string | null;
  received_by: string;
  created_at: string;
  updated_at: string;
};

export type InvoiceScopeChangeRow = {
  id: string;
  invoice_id: string;
  change_type: "addition" | "removal" | "adjustment" | "note";
  title: string;
  description: string | null;
  amount_cents: number;
  before_total_cents: number | null;
  after_total_cents: number | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_by: string;
  created_at: string;
};

export type InvoiceTemplateRow = {
  id: string;
  name: string;
  service_type: string | null;
  description: string | null;
  line_items: InvoiceLineItem[];
  scope_notes: string | null;
  default_terms: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InvoiceAuditEventRow = {
  id: string;
  invoice_id: string;
  event_type: string;
  actor_name: string;
  summary: string;
  before_snapshot: Record<string, unknown> | null;
  after_snapshot: Record<string, unknown> | null;
  created_at: string;
};

export type CrewAssignment = {
  name: string;
  role: string | null;
  crew_member_id?: string | null;
  pay_type?: "hourly" | "flat" | "percentage" | "split" | null;
  pay_rate_cents?: number | null;
  hours?: number | null;
  split_percent?: number | null;
  is_lead?: boolean;
  trainee_multiplier?: number | null;
  flat_bonus_cents?: number | null;
  lead_bonus_percent?: number | null;
};

export type CrewMemberRow = {
  id: string;
  full_name: string;
  role: string;
  status: string;
  skill_level: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  certifications: string | null;
  availability_notes: string | null;
  default_pay_type: string;
  default_pay_rate_cents: number;
  default_pay_percent: number;
  lead_bonus_percent: number;
  trainee_pay_multiplier: number;
  is_active: boolean;
  performance_meta: Record<string, unknown>;
  equipment_meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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


export type OperationalTaskStatus = "todo" | "scheduled" | "in_progress" | "blocked" | "done" | "cancelled";

export type OperationalTaskPriority = "urgent" | "high" | "normal" | "low";

export type OperationalTaskComment = {
  id: string;
  body: string;
  author: string;
  created_at: string;
};

export type OperationalTaskActivity = {
  id: string;
  type: string;
  label: string;
  created_at: string;
};

export type OperationalTaskRow = {
  id: string;
  job_id: string;
  client_id: string | null;
  title: string;
  status: OperationalTaskStatus;
  priority: OperationalTaskPriority;
  priority_rank: number;
  due_at: string | null;
  recurring_rule: string | null;
  assigned_crew_member_id: string | null;
  assigned_crew_name: string | null;
  completion_photo_urls: string[];
  comments: OperationalTaskComment[];
  activity_log: OperationalTaskActivity[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};


export type OperationalActivityRow = {
  id: string;
  event_type: string;
  title: string;
  body: string | null;
  actor_name: string;
  job_id: string | null;
  client_id: string | null;
  task_id: string | null;
  invoice_id: string | null;
  expense_id: string | null;
  href: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type TaskTemplateRow = {
  id: string;
  name: string;
  service_type: string | null;
  title: string;
  priority: OperationalTaskPriority;
  recurring_rule: string | null;
  operational_notes: string | null;
  attachment_prompt: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

export type InventoryItemRow = {
  id: string;
  name: string;
  category: string;
  inventory_type: string;
  operational_status: string;
  quantity: number;
  unit: string;
  storage_location: string | null;
  reorder_level: number;
  unit_cost_cents: number;
  vendor: string | null;
  notes: string | null;
  assigned_crew: string | null;
  assigned_job_id: string | null;
  last_restocked: string | null;
  condition: string | null;
  is_consumable: boolean;
  priority_level: string;
  priority_rank: number;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
