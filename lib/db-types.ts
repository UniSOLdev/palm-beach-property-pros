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
  total_cents: number;
  public_token: string;
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
};
