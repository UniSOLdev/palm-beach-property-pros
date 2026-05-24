"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseImportRow } from "@/lib/admin/expense-import-utils";

export async function fetchExistingExpenseFingerprints() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("expense_date, vendor, amount")
    .eq("archived", false)
    .order("expense_date", { ascending: false })
    .limit(500);
  return data ?? [];
}

export async function batchImportExpensesAction(
  rows: ExpenseImportRow[],
  options: { skipInvalid?: boolean; skipDuplicates?: boolean; job_id?: string | null } = {},
) {
  const supabase = await createClient();
  const valid = rows.filter((r) => {
    if (options.skipInvalid && r.errors.length > 0) return false;
    if (options.skipDuplicates && r.duplicateHint) return false;
    return r.errors.length === 0;
  });

  if (!valid.length) throw new Error("No valid rows to import");

  const batchId = crypto.randomUUID().slice(0, 8);
  const payload = valid.map((r) => ({
    expense_date: r.expense_date,
    category: r.category,
    vendor: r.vendor,
    description: r.description,
    amount: r.amount,
    payment_method: r.payment_method,
    job_id: options.job_id ?? null,
    notes: r.notes ? `${r.notes} · import:${batchId}` : `import:${batchId}`,
    expense_type: options.job_id ? "Job" : "Operating",
    reimbursable: false,
    reimbursed: false,
    is_recurring: false,
  }));

  const { error } = await supabase.from("expenses").insert(payload);
  if (error) throw new Error(error.message);

  if (options.job_id) {
    const total = valid.reduce((s, r) => s + r.amount, 0);
    const { data: job } = await supabase
      .from("jobs")
      .select("job_expense_total")
      .eq("id", options.job_id)
      .single();
    if (job) {
      await supabase
        .from("jobs")
        .update({ job_expense_total: Number(job.job_expense_total) + total })
        .eq("id", options.job_id);
    }
  }

  revalidatePath("/admin/expenses");
  return { imported: valid.length, batchId, skipped: rows.length - valid.length };
}
