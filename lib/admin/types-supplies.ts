export type SupplyRow = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  storage_location: string | null;
  reorder_level: number;
  cost: number;
  vendor: string | null;
  notes: string | null;
  is_reusable: boolean;
  expense_id: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
};

export type SupplyJobUsageRow = {
  id: string;
  supply_id: string;
  job_id: string;
  quantity_used: number;
  notes: string | null;
  created_at: string;
};

export type SaveSupplyInput = {
  id?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  storage_location?: string | null;
  reorder_level: number;
  cost: number;
  vendor?: string | null;
  notes?: string | null;
  is_reusable?: boolean;
  expense_id?: string | null;
};
