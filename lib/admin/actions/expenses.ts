"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  reimbursable?: boolean;
  is_recurring?: boolean;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    ...input,
    expense_type: "Operating",
    reimbursable: input.reimbursable ?? false,
    reimbursed: false,
    is_recurring: input.is_recurring ?? false,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/expenses");
}
