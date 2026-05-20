export type JobPhotoCategory = "before" | "after" | "receipt" | "general";

export type JobPhoto = {
  id: string;
  job_id: string;
  category: JobPhotoCategory;
  storage_path: string;
  file_url: string;
  created_at: string;
  legacy?: boolean;
};

export type JobRow = {
  id: string;
  client_id: string;
  service_type: string;
  address: string;
  job_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  assigned_crew_ids: string[];
  job_notes: string | null;
  internal_notes: string | null;
  before_photo_urls: string[] | null;
  after_photo_urls: string[] | null;
  quote_id: string | null;
  invoice_id: string | null;
  revenue: number;
  job_expense_total: number;
  payment_method: string | null;
  created_at: string;
  estimated_labor_cost: number;
  estimated_materials_cost: number;
  fuel_cost: number;
  dump_fee_cost: number;
  truck_rental_cost: number;
  equipment_cost: number;
  clients: { name: string; phone: string | null; email: string | null; address: string | null } | null;
};

export type JobExpenseRow = {
  id: string;
  expense_date: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
  receipt_url: string | null;
  payment_method: string;
};

export type JobCrewPayoutRow = {
  id: string;
  pay_type: string;
  calculated_total: number;
  hours: number | null;
  created_at: string;
};

export type JobDetailPayload = {
  job: JobRow;
  photos: JobPhoto[];
  expenses: JobExpenseRow[];
  crewPayouts: JobCrewPayoutRow[];
  crewNames: Record<string, string>;
};
