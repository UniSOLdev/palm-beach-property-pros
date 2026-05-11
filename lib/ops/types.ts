export type OpsServiceLine =
  | "Listing Prep"
  | "Move-Out Clean"
  | "Detailing"
  | "Pressure Washing"
  | "Maintenance"
  | "Recurring Care";

export type OpsJobStatus = "lead" | "quoted" | "scheduled" | "active" | "invoiced" | "paid";

export type OpsContact = {
  id: string;
  name: string;
  type: "homeowner" | "realtor" | "property-manager" | "commercial";
  phone?: string;
  email?: string;
  lifetimeValue: number;
  tags: string[];
  lastInteraction: string;
};

export type OpsJob = {
  id: string;
  clientId: string;
  propertyName: string;
  address: string;
  serviceLine: OpsServiceLine;
  status: OpsJobStatus;
  quotedAmount: number;
  invoiceAmount: number;
  estimatedLaborHours: number;
  actualLaborHours: number;
  crewSize: number;
  scheduledFor: string;
  source: "walkthrough" | "referral" | "recurring" | "website";
};

export type RevenueEntry = {
  id: string;
  jobId: string;
  date: string;
  amount: number;
  category: OpsServiceLine;
  recurring: boolean;
  paymentStatus: "pending" | "paid";
};

export type ExpenseEntry = {
  id: string;
  date: string;
  amount: number;
  category: "labor" | "supplies" | "fuel" | "equipment" | "software" | "marketing" | "insurance";
  vendor: string;
  jobId?: string;
  recurring: boolean;
};

export type LaborEntry = {
  id: string;
  jobId: string;
  crewMember: string;
  hours: number;
  hourlyCost: number;
};

export type OpsSnapshot = {
  contacts: OpsContact[];
  jobs: OpsJob[];
  revenue: RevenueEntry[];
  expenses: ExpenseEntry[];
  labor: LaborEntry[];
};

export type OpsMetrics = {
  revenueTotal: number;
  paidRevenue: number;
  pendingRevenue: number;
  recurringRevenue: number;
  expenseTotal: number;
  laborCost: number;
  grossProfit: number;
  grossMargin: number;
  averageJobValue: number;
  activeJobs: number;
  quotePipeline: number;
  laborUtilization: number;
  serviceMix: Array<{ label: OpsServiceLine; value: number }>;
};

export type SpreadsheetColumnRole =
  | "date"
  | "client"
  | "service"
  | "revenue"
  | "expense"
  | "laborHours"
  | "category"
  | "status"
  | "notes";

export type SpreadsheetMapping = {
  sourceName: string;
  columns: Array<{
    sourceColumn: string;
    role: SpreadsheetColumnRole;
    required: boolean;
  }>;
};
