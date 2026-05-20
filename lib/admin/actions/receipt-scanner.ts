"use server";

import { extractReceiptFromImageUrl } from "@/lib/admin/receipt-extraction";
import { createExpense } from "@/lib/admin/actions/expenses";

export async function extractReceiptAction(receiptImageUrl: string) {
  if (!receiptImageUrl?.startsWith("http")) {
    throw new Error("Invalid receipt image URL");
  }
  return extractReceiptFromImageUrl(receiptImageUrl);
}

export async function saveScannedExpenseAction(input: {
  expense_date: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
  payment_method: string;
  receipt_url: string | null;
  receipt_storage_path?: string | null;
  job_id?: string | null;
  notes?: string | null;
  reimbursable?: boolean;
  tax_amount?: number | null;
  subtotal?: number | null;
}) {
  let notes = input.notes?.trim() || null;
  if (input.tax_amount != null || input.subtotal != null) {
    const parts: string[] = [];
    if (input.subtotal != null) parts.push(`Subtotal: $${input.subtotal.toFixed(2)}`);
    if (input.tax_amount != null) parts.push(`Tax: $${input.tax_amount.toFixed(2)}`);
    const extra = parts.join(" · ");
    notes = notes ? `${notes} · ${extra}` : extra;
  }

  await createExpense({
    expense_date: input.expense_date,
    category: input.category,
    vendor: input.vendor,
    description: input.description,
    amount: input.amount,
    payment_method: input.payment_method,
    receipt_url: input.receipt_url,
    job_id: input.job_id ?? null,
    notes,
    reimbursable: input.reimbursable ?? false,
    expense_type: input.job_id ? "Job" : "Operating",
  });
}
