import type {
  AdminDataset,
  BusinessSettings,
  Client,
  CrewMember,
  CrewPayout,
  Expense,
  Invoice,
  Job,
  PaymentMethod,
  Quote,
  SopTemplate,
  Supply,
} from "./types";

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);

export const clientNeil: Client = {
  id: "client_neil",
  name: "Neil",
  phone: "(561) 555-0142",
  email: "neil@example.com",
  address: "1240 Coastal Lane, Palm Beach Gardens, FL 33410",
  clientType: "Residential",
  referralSource: "Neighbor referral",
  notes: "Large home; confirm scope after movers finish.",
  followUpDate: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)),
  reviewStatus: "Not sent",
  createdAt: new Date(today.getFullYear(), today.getMonth() - 1, 5).toISOString(),
};

export const clients: Client[] = [
  clientNeil,
  {
    id: "client_marina",
    name: "Marina Isles HOA — Office",
    phone: "(561) 555-0199",
    email: "office@marinaisles.example.com",
    address: "88 Marina Blvd, Jupiter, FL 33477",
    clientType: "Commercial",
    referralSource: "Google",
    notes: "Quarterly common-area refresh.",
    followUpDate: null,
    reviewStatus: "Completed",
    createdAt: new Date(today.getFullYear(), today.getMonth() - 4, 12).toISOString(),
  },
  {
    id: "client_airbnb",
    name: "Coastal Stays LLC",
    phone: "(561) 555-0171",
    email: "ops@coastalstays.example.com",
    address: "Multiple units — Singer Island",
    clientType: "Airbnb Host",
    referralSource: "Repeat client",
    notes: "Same-day turnover windows on weekends.",
    followUpDate: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)),
    reviewStatus: "Sent",
    createdAt: new Date(today.getFullYear(), today.getMonth() - 2, 2).toISOString(),
  },
];

function buildSop(title: string, slug: string, minutes: number): SopTemplate {
  return {
    id: `sop_${slug}`,
    slug,
    title,
    estimatedMinutes: minutes,
    suppliesNeeded: [
      "All-purpose cleaner (pH-safe)",
      "Glass cleaner",
      "Microfiber towels (color-coded)",
      "Mop & bucket",
      "Vacuum with HEPA",
      "PPE & shoe covers",
    ],
    steps: [
      { id: `${slug}_1`, label: "Walkthrough: note priorities and hazards" },
      { id: `${slug}_2`, label: "Dry dust high-to-low; vents, ledges, fans" },
      { id: `${slug}_3`, label: "Kitchen: degrease surfaces; polish fixtures" },
      { id: `${slug}_4`, label: "Baths: disinfect; detail grout lines & glass" },
      { id: `${slug}_5`, label: "Floors: vacuum → mop (correct product per floor)" },
      { id: `${slug}_6`, label: "Final QC pass with checklist" },
    ],
    crewRoles: ["Lead — client comms + QC", "Tech — execution", "Trainee — support tasks"],
    qualityControl: [
      { id: `${slug}_qc1`, label: "Fingerprints removed from glass/mirrors" },
      { id: `${slug}_qc2`, label: "Trash removed; liners replaced" },
      { id: `${slug}_qc3`, label: "No product residue on stainless" },
    ],
    photoChecklist: [
      { id: `${slug}_ph1`, label: "Wide shots of each major room (before)" },
      { id: `${slug}_ph2`, label: "Problem areas close-ups (before)" },
      { id: `${slug}_ph3`, label: "Matching angles after completion" },
    ],
    completion: [
      { id: `${slug}_c1`, label: "Client notified 15 min prior to finish" },
      { id: `${slug}_c2`, label: "Photos uploaded to job folder" },
      { id: `${slug}_c3`, label: "Lock-up checklist complete" },
    ],
  };
}

export const sopTemplates: SopTemplate[] = [
  buildSop("Move-out Cleaning", "move-out", 360),
  buildSop("Deep Cleaning", "deep-clean", 300),
  buildSop("Standard Residential Cleaning", "standard-res", 150),
  buildSop("Commercial Cleaning", "commercial", 240),
  buildSop("Interior Auto Detail", "auto-int", 180),
  buildSop("Exterior Auto Detail", "auto-ext", 120),
  buildSop("Full Detail", "auto-full", 300),
  buildSop("Pressure Washing", "pressure", 210),
  buildSop("Window Cleaning", "windows", 120),
  buildSop("Carpet / Rug Cleaning", "carpet", 180),
  buildSop("Airbnb Turnover", "airbnb", 120),
  buildSop("Final Walkthrough", "walkthrough", 45),
];

export const crewMembers: CrewMember[] = [
  {
    id: "crew_lead",
    name: "Jordan M.",
    phone: "(561) 555-0101",
    role: "Lead Technician",
    defaultPayRate: 32,
    payRateUnit: "hour",
    notes: "Preferred for move-outs.",
  },
  {
    id: "crew_tech",
    name: "Sam R.",
    phone: "(561) 555-0102",
    role: "Technician",
    defaultPayRate: 24,
    payRateUnit: "hour",
    notes: "Strong on detailing.",
  },
  {
    id: "crew_trainee",
    name: "Alex T.",
    phone: "(561) 555-0103",
    role: "Trainee",
    defaultPayRate: 18,
    payRateUnit: "hour",
    notes: "Shadowing through Q2.",
  },
];

export const quoteNeilMoveout: Quote = {
  id: "quote_neil_moveout",
  publicId: "pub_quote_neil_moveout",
  quoteNumber: "PBPP-Q-1042",
  clientId: "client_neil",
  jobAddress: "1240 Coastal Lane, Palm Beach Gardens, FL 33410",
  serviceType: "Move-out Cleaning",
  lineItems: [
    { id: "li1", description: "Full move-out cleaning (≈4,000 sq ft)", quantity: 1, unitPrice: 650 },
    { id: "li2", description: "Rug cleaning labor", quantity: 1, unitPrice: 125 },
    {
      id: "li3",
      description: "Rug Doctor rental — client reimburses rental fee (receipt on file)",
      quantity: 1,
      unitPrice: 0,
    },
    {
      id: "li4",
      description: "Trash removal — TBD pending final walk with empty home",
      quantity: 1,
      unitPrice: 0,
    },
    { id: "li5", description: "Patio pressure wash touch-up", quantity: 1, unitPrice: 100 },
  ],
  optionalAddons: [
    { id: "ad1", description: "Interior window cleaning (full home)", quantity: 1, unitPrice: 185, isAddon: true },
    { id: "ad2", description: "Appliance deep cleaning (in/out)", quantity: 1, unitPrice: 95, isAddon: true },
  ],
  notes:
    "Movers were delayed and home was not fully emptied during first walkthrough. Scope may expand once house is empty.",
  terms:
    "Estimate valid 14 days. Final price may adjust after empty-home walkthrough. Deposits are non-refundable once materials block time is reserved.",
  expirationDate: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14)),
  status: "Draft",
  depositRequired: true,
  depositAmount: 250,
  internalNotes: "Confirm rug sizes on site. Patio is partial sun — algae light.",
  createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString(),
  depositReceived: false,
  depositReceivedAt: null,
};

export const quotes: Quote[] = [
  quoteNeilMoveout,
  {
    id: "quote_marina_q1",
    publicId: "pub_quote_marina",
    quoteNumber: "PBPP-Q-1038",
    clientId: "client_marina",
    jobAddress: "88 Marina Blvd, Jupiter, FL 33477",
    serviceType: "Commercial Cleaning",
    lineItems: [
      { id: "m1", description: "Clubhouse deep clean", quantity: 1, unitPrice: 890 },
      { id: "m2", description: "Interior windows (common areas)", quantity: 1, unitPrice: 220 },
    ],
    optionalAddons: [],
    notes: "Schedule after 6pm weekdays.",
    terms: "Net 15 from invoice date.",
    expirationDate: iso(new Date(today.getFullYear(), today.getMonth() + 1, 1)),
    status: "Sent",
    depositRequired: false,
    depositAmount: 0,
    internalNotes: "",
    createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString(),
    depositReceived: false,
    depositReceivedAt: null,
  },
];

export const jobs: Job[] = [
  {
    id: "job_neil_walkthrough",
    clientId: "client_neil",
    serviceType: "Move-out Cleaning",
    address: "1240 Coastal Lane, Palm Beach Gardens, FL 33410",
    date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)),
    startTime: "09:00",
    endTime: "13:00",
    status: "Scheduled",
    assignedCrewIds: ["crew_lead", "crew_tech"],
    jobNotes: "Empty-home walkthrough + start clean if scope approved.",
    internalNotes: "Watch for chandelier in foyer — ladder rated.",
    beforePhotoUrls: [],
    afterPhotoUrls: [],
    quoteId: "quote_neil_moveout",
    invoiceId: null,
    revenue: 0,
    jobExpenseTotal: 0,
    paymentMethod: null,
    reviewRequested: false,
    referralSource: "Neighbor referral",
    createdAt: new Date().toISOString(),
  },
  {
    id: "job_airbnb_turn",
    clientId: "client_airbnb",
    serviceType: "Airbnb Turnover",
    address: "Unit 12B — Singer Island",
    date: iso(today),
    startTime: "11:00",
    endTime: "14:00",
    status: "In Progress",
    assignedCrewIds: ["crew_tech", "crew_trainee"],
    jobNotes: "Owner checkout 10:30; guest check-in 4pm.",
    internalNotes: "Linens in closet A.",
    beforePhotoUrls: [],
    afterPhotoUrls: [],
    quoteId: null,
    invoiceId: "inv_airbnb_01",
    revenue: 285,
    jobExpenseTotal: 42,
    paymentMethod: "Zelle",
    reviewRequested: true,
    referralSource: "Repeat client",
    createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString(),
  },
  {
    id: "job_marina_done",
    clientId: "client_marina",
    serviceType: "Commercial Cleaning",
    address: "88 Marina Blvd, Jupiter, FL 33477",
    date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)),
    startTime: "18:30",
    endTime: "22:30",
    status: "Paid",
    assignedCrewIds: ["crew_lead", "crew_tech", "crew_trainee"],
    jobNotes: "After-hours access via side gate.",
    internalNotes: "",
    beforePhotoUrls: [],
    afterPhotoUrls: [],
    quoteId: "quote_marina_q1",
    invoiceId: "inv_marina_01",
    revenue: 1110,
    jobExpenseTotal: 180,
    paymentMethod: "Check",
    reviewRequested: true,
    referralSource: "Google",
    createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 20).toISOString(),
  },
  {
    id: "job_windows_today",
    clientId: "client_airbnb",
    serviceType: "Window Cleaning",
    address: "Coastal condo — West Palm Beach",
    date: iso(today),
    startTime: "07:30",
    endTime: "11:30",
    status: "Paid",
    assignedCrewIds: ["crew_lead", "crew_tech"],
    jobNotes: "High glass — lift-safe route confirmed.",
    internalNotes: "",
    beforePhotoUrls: [],
    afterPhotoUrls: [],
    quoteId: null,
    invoiceId: "inv_windows_today",
    revenue: 425,
    jobExpenseTotal: 35,
    paymentMethod: "Zelle",
    reviewRequested: true,
    referralSource: "Referral partner",
    createdAt: new Date().toISOString(),
  },
];

export const invoices: Invoice[] = [
  {
    id: "inv_airbnb_01",
    publicId: "pub_inv_airbnb_01",
    invoiceNumber: "PBPP-INV-2201",
    clientId: "client_airbnb",
    jobId: "job_airbnb_turn",
    quoteId: null,
    lineItems: [
      { id: "i1", description: "Airbnb turnover clean", quantity: 1, unitPrice: 285 },
    ],
    discount: 0,
    depositPaid: 0,
    paymentStatus: "Unpaid",
    paymentMethod: "Zelle",
    paidDate: null,
    notes: "Zelle preferred — invoice on file.",
    terms: "Due on receipt.",
    reviewRequestStatus: "Not sent",
    dueDate: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)),
    createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString(),
  },
  {
    id: "inv_marina_01",
    publicId: "pub_inv_marina_01",
    invoiceNumber: "PBPP-INV-2188",
    clientId: "client_marina",
    jobId: "job_marina_done",
    quoteId: "quote_marina_q1",
    lineItems: [
      { id: "im1", description: "Clubhouse deep clean", quantity: 1, unitPrice: 890 },
      { id: "im2", description: "Interior windows (common areas)", quantity: 1, unitPrice: 220 },
    ],
    discount: 0,
    depositPaid: 0,
    paymentStatus: "Paid",
    paymentMethod: "Check",
    paidDate: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4)),
    notes: "Thank you!",
    terms: "Net 15.",
    reviewRequestStatus: "Completed",
    dueDate: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10)),
    createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 12).toISOString(),
  },
  {
    id: "inv_windows_today",
    publicId: "pub_inv_windows_today",
    invoiceNumber: "PBPP-INV-2309",
    clientId: "client_airbnb",
    jobId: "job_windows_today",
    quoteId: null,
    lineItems: [{ id: "w1", description: "Interior & exterior windows (coastal build)", quantity: 1, unitPrice: 425 }],
    discount: 0,
    depositPaid: 0,
    paymentStatus: "Paid",
    paymentMethod: "Zelle",
    paidDate: iso(today),
    notes: "",
    terms: "Due on receipt.",
    reviewRequestStatus: "Sent",
    dueDate: iso(today),
    createdAt: new Date().toISOString(),
  },
];

export const expenses: Expense[] = [
  {
    id: "exp_gas_1",
    date: iso(today),
    category: "Gas",
    vendor: "Shell",
    description: "Route — north county day",
    amount: 68.4,
    paymentMethod: "Card",
    jobId: "job_airbnb_turn",
    serviceType: "Airbnb Turnover",
    receiptUrl: null,
    expenseType: "Job-specific",
    reimbursable: false,
    reimbursed: false,
    notes: "",
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp_chem",
    date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)),
    category: "Chemicals",
    vendor: "Jan-Supply Co.",
    description: "Glass cleaner concentrate (case)",
    amount: 124.9,
    paymentMethod: "Card",
    jobId: null,
    receiptUrl: null,
    expenseType: "Reusable supplies",
    reimbursable: false,
    reimbursed: false,
    notes: "Stock for Q2",
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp_equip",
    date: iso(new Date(today.getFullYear(), today.getMonth() - 1, 18)),
    category: "Equipment",
    vendor: "PressurePro",
    description: "Surface cleaner attachment",
    amount: 189,
    paymentMethod: "Card",
    jobId: null,
    receiptUrl: null,
    expenseType: "Equipment investment",
    reimbursable: false,
    reimbursed: false,
    notes: "CapEx style — amortize mentally over 24 mo",
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp_window_kit",
    date: iso(today),
    category: "Supplies",
    vendor: "GlassMaster Supply",
    description: "Squeegee rubber + pure water resin (window route)",
    amount: 35,
    paymentMethod: "Card",
    jobId: "job_windows_today",
    serviceType: "Window Cleaning",
    receiptUrl: null,
    expenseType: "Job-specific",
    reimbursable: false,
    reimbursed: false,
    notes: "",
    createdAt: new Date().toISOString(),
  },
];

export const supplies: Supply[] = [
  {
    id: "sup_glass",
    name: "Glass cleaner concentrate",
    category: "Cleaning chemicals",
    quantity: 6,
    unit: "bottle",
    storageLocation: "Van A — shelf 2",
    reorderLevel: 4,
    cost: 18.5,
    vendor: "Jan-Supply Co.",
    notes: "",
  },
  {
    id: "sup_mf",
    name: "Microfiber towels (blue)",
    category: "Towels",
    quantity: 48,
    unit: "each",
    storageLocation: "Shop — bin C",
    reorderLevel: 24,
    cost: 0.85,
    vendor: "Detail Wholesale",
    notes: "Wash hot, no softener",
  },
];

export const crewPayouts: CrewPayout[] = [
  {
    id: "payout_marina",
    jobId: "job_marina_done",
    crewMemberIds: ["crew_lead", "crew_tech", "crew_trainee"],
    payType: "hourly",
    hours: 14,
    percent: null,
    flatAmount: null,
    calculatedTotal: 14 * (32 + 24 + 18),
    createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString(),
  },
];

export const businessSettings: BusinessSettings = {
  businessName: "Palm Beach Property Pros",
  phone: "(561) 629-2617",
  email: "hello@palmbeachpropertypros.com",
  website: "https://www.palmbeachpropertypros.com",
  logoUrl: null,
  address: "Serving Palm Beach County, FL",
  googleReviewUrl: "https://g.page/r/example-review-link",
  defaultInvoiceTerms: "Payment due on receipt unless otherwise noted. Late fees may apply after 14 days.",
  defaultQuoteTerms:
    "Estimates are valid for 14 days. Scope changes may adjust pricing. Deposits secure scheduling.",
  paymentMethodsAccepted: ["Cash", "Zelle", "Card", "Check"] as PaymentMethod[],
  brandPrimary: "#0C2340",
  brandAccent: "#6A8F6B",
  squareBookingUrl: null,
  squareInvoiceUrl: null,
  zelleDisplayName: null,
  zelleEmail: null,
  zellePhone: null,
  depositInstructions: null,
  cancellationPolicy: null,
  bookingCtaText: null,
  paymentCtaText: null,
  preferredBookingMethod: "Quote Form",
  bookingPaymentMethods: ["Cash", "Zelle", "Card", "Check", "Square Invoice"],
};

export const adminSeed: AdminDataset = {
  businessSettings,
  clients,
  jobs,
  quotes,
  invoices,
  expenses,
  sopTemplates,
  supplies,
  crewMembers,
  crewPayouts,
};

export function getClientById(id: string) {
  return clients.find((c) => c.id === id);
}

export function getJobById(id: string) {
  return jobs.find((j) => j.id === id);
}

export function getQuoteById(id: string) {
  return quotes.find((q) => q.id === id);
}

export function getQuoteByPublicId(publicId: string) {
  return quotes.find((q) => q.publicId === publicId);
}

export function getInvoiceById(id: string) {
  return invoices.find((i) => i.id === id);
}

export function getInvoiceByPublicId(publicId: string) {
  return invoices.find((i) => i.publicId === publicId);
}

export function getExpenseById(id: string) {
  return expenses.find((e) => e.id === id);
}

export function getSupplyById(id: string) {
  return supplies.find((s) => s.id === id);
}

export function getSopBySlug(slug: string) {
  return sopTemplates.find((s) => s.slug === slug);
}

export function getCrewById(id: string) {
  return crewMembers.find((c) => c.id === id);
}
