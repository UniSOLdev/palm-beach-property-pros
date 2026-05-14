/** Types mirror intended Supabase schema for a clean future migration. */

export type JobStatus =
  | "Lead"
  | "Quoted"
  | "Approved"
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Paid"
  | "Cancelled";

export type QuoteStatus =
  | "Draft"
  | "Sent"
  | "Approved"
  | "Declined"
  | "Converted to Invoice";

export type InvoicePaymentStatus = "Unpaid" | "Partially Paid" | "Paid" | "Overdue";

export type PaymentMethod = "Cash" | "Zelle" | "Card" | "Check" | "Square Invoice" | "Other";

export type ClientType =
  | "Residential"
  | "Commercial"
  | "Dealership"
  | "Property Manager"
  | "Airbnb Host"
  | "Club Member"
  | "Other";

export type ExpenseCategory =
  | "Chemicals"
  | "Gas"
  | "Equipment"
  | "Rentals"
  | "Dump fees"
  | "Labor"
  | "Marketing"
  | "Software"
  | "Supplies"
  | "Repairs"
  | "Storage"
  | "Vehicle"
  | "Miscellaneous";

export type ExpenseType = "Job-specific" | "Reusable supplies" | "Equipment investment" | "Overhead";

export type SupplyCategory =
  | "Cleaning chemicals"
  | "Detailing chemicals"
  | "Towels"
  | "Mops"
  | "Brushes"
  | "Bags"
  | "Gloves"
  | "Paper products"
  | "Equipment"
  | "Rental items"
  | "Misc.";

export type ReviewRequestStatus = "Not sent" | "Sent" | "Completed";

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  clientType: ClientType;
  referralSource: string;
  notes: string;
  followUpDate: string | null;
  reviewStatus: ReviewRequestStatus;
  createdAt: string;
}

export interface Job {
  id: string;
  clientId: string;
  serviceType: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  status: JobStatus;
  assignedCrewIds: string[];
  jobNotes: string;
  internalNotes: string;
  beforePhotoUrls: string[];
  afterPhotoUrls: string[];
  quoteId: string | null;
  invoiceId: string | null;
  revenue: number;
  jobExpenseTotal: number;
  paymentMethod: PaymentMethod | null;
  reviewRequested: boolean;
  referralSource: string;
  createdAt: string;
}

export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  isAddon?: boolean;
}

export interface Quote {
  id: string;
  publicId: string;
  quoteNumber: string;
  clientId: string;
  jobAddress: string;
  serviceType: string;
  lineItems: QuoteLineItem[];
  optionalAddons: QuoteLineItem[];
  notes: string;
  terms: string;
  expirationDate: string;
  status: QuoteStatus;
  depositRequired: boolean;
  depositAmount: number;
  internalNotes: string;
  createdAt: string;
  /** If converted, links to invoice */
  invoiceId?: string | null;
  /** Admin / ops: client deposit received */
  depositReceived?: boolean;
  depositReceivedAt?: string | null;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  publicId: string;
  invoiceNumber: string;
  clientId: string;
  jobId: string | null;
  quoteId: string | null;
  lineItems: InvoiceLineItem[];
  discount: number;
  depositPaid: number;
  paymentStatus: InvoicePaymentStatus;
  paymentMethod: PaymentMethod | null;
  paidDate: string | null;
  notes: string;
  terms: string;
  reviewRequestStatus: ReviewRequestStatus;
  dueDate: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  vendor: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  jobId: string | null;
  /** Optional; may mirror linked job service type or be entered manually */
  serviceType?: string | null;
  receiptUrl: string | null;
  expenseType: ExpenseType;
  reimbursable: boolean;
  reimbursed: boolean;
  notes: string;
  createdAt: string;
}

export interface SopChecklistItem {
  id: string;
  label: string;
  done?: boolean;
}

export interface SopTemplate {
  id: string;
  slug: string;
  title: string;
  estimatedMinutes: number;
  suppliesNeeded: string[];
  steps: SopChecklistItem[];
  crewRoles: string[];
  qualityControl: SopChecklistItem[];
  photoChecklist: SopChecklistItem[];
  completion: SopChecklistItem[];
}

export interface Supply {
  id: string;
  name: string;
  category: SupplyCategory;
  quantity: number;
  unit: string;
  storageLocation: string;
  reorderLevel: number;
  cost: number;
  vendor: string;
  notes: string;
}

export interface CrewMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  defaultPayRate: number;
  payRateUnit: "hour" | "job" | "percent";
  notes: string;
}

export interface CrewPayout {
  id: string;
  jobId: string;
  crewMemberIds: string[];
  payType: "flat rate" | "hourly" | "percentage";
  hours: number | null;
  percent: number | null;
  flatAmount: number | null;
  calculatedTotal: number;
  createdAt: string;
}

export type PreferredBookingMethod = "Square" | "Quote Form" | "Phone/Text" | "Manual";

export interface BusinessSettings {
  id?: string;
  businessName: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string | null;
  address: string;
  googleReviewUrl: string;
  defaultInvoiceTerms: string;
  defaultQuoteTerms: string;
  paymentMethodsAccepted: PaymentMethod[];
  brandPrimary: string;
  brandAccent: string;
  /** Public Square Appointments (or similar) URL */
  squareBookingUrl: string | null;
  /** Square Online Checkout / invoices portal */
  squareInvoiceUrl: string | null;
  zelleDisplayName: string | null;
  zelleEmail: string | null;
  zellePhone: string | null;
  depositInstructions: string | null;
  cancellationPolicy: string | null;
  bookingCtaText: string | null;
  paymentCtaText: string | null;
  preferredBookingMethod: PreferredBookingMethod;
  /** Shown on marketing / public payment copy (can include Square Invoice) */
  bookingPaymentMethods: string[];
}

export interface AdminDataset {
  businessSettings: BusinessSettings;
  clients: Client[];
  jobs: Job[];
  quotes: Quote[];
  invoices: Invoice[];
  expenses: Expense[];
  sopTemplates: SopTemplate[];
  supplies: Supply[];
  crewMembers: CrewMember[];
  crewPayouts: CrewPayout[];
}
