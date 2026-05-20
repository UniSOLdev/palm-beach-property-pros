import type { ChangeOrderStatus } from "@/lib/admin/change-order-constants";

export type ChangeOrderItemRow = {
  id: string;
  change_order_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
};

export type ChangeOrderRow = {
  id: string;
  public_id: string;
  change_order_number: string;
  job_id: string;
  client_id: string;
  invoice_id: string | null;
  status: ChangeOrderStatus;
  title: string;
  scope_change_reason: string | null;
  notes: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  approval_signature_name: string | null;
  approval_signature_text: string | null;
  approval_ip: string | null;
  approval_user_agent: string | null;
  approval_terms_version: string | null;
  approval_snapshot_json: Record<string, unknown> | null;
  decline_reason: string | null;
  sent_at: string | null;
  approved_at: string | null;
  declined_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
};

export type ChangeOrderLineInput = {
  description: string;
  quantity: number;
  unit_price: number;
};

export type SaveChangeOrderInput = {
  id?: string;
  job_id: string;
  client_id: string;
  title: string;
  scope_change_reason?: string | null;
  notes?: string | null;
  tax_rate?: number;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  lines: ChangeOrderLineInput[];
  mark_sent?: boolean;
};
