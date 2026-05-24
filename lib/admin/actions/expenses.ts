"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fromSupabase, type DbQueryResult } from "@/lib/admin/db-query";

export async function createExpense(input: {
  expense_date: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
  payment_method: string;
  job_id?: string | null;
  crew_member_id?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  reimbursable?: boolean;
  is_recurring?: boolean;
  expense_type?: "Operating" | "Job";
}) {
  const supabase = await createClient();
  const jobId = input.job_id ?? null;
  const expenseType = input.expense_type ?? (jobId ? "Job" : "Operating");

  const { error } = await supabase.from("expenses").insert({
    expense_date: input.expense_date,
    category: input.category,
    vendor: input.vendor,
    description: input.description,
    amount: input.amount,
    payment_method: input.payment_method,
    job_id: jobId,
    crew_member_id: input.crew_member_id ?? null,
    receipt_url: input.receipt_url ?? null,
    notes: input.notes ?? null,
    expense_type: expenseType,
    reimbursable: input.reimbursable ?? false,
    reimbursed: false,
    is_recurring: input.is_recurring ?? false,
  });
  if (error) throw new Error(error.message);

  if (jobId) {
    const { data: job } = await supabase.from("jobs").select("job_expense_total").eq("id", jobId).single();
    if (job) {
      const nextTotal = Number(job.job_expense_total) + Number(input.amount);
      await supabase.from("jobs").update({ job_expense_total: nextTotal }).eq("id", jobId);
    }
    revalidatePath(`/admin/jobs/${jobId}`);
  }

  revalidatePath("/admin/expenses");
}

export async function listJobsForExpenseLink(): Promise<
  DbQueryResult<{ id: string; label: string }[]>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("id, service_type, address")
    .eq("archived", false)
    .order("job_date", { ascending: false })
    .limit(80);
  const result = fromSupabase(data, error, { route: "/admin/expenses", query: "jobs for expense link" });
  if (!result.ok) return result;
  return {
    ok: true,
    data: (result.data ?? []).map((j) => ({
      id: j.id,
      label: `${j.service_type} · ${j.address}`,
    })),
  };
}
