"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function newPublicId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function createInvoiceDraft(input: {
  client_id: string;
  job_id?: string;
  due_date?: string;
  terms?: string;
  lines: { description: string; quantity: number; unit_price: number }[];
}) {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("business_settings")
    .select("default_invoice_terms")
    .limit(1)
    .maybeSingle();
  const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true });
  const invoice_number = `PBPP-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      public_id: newPublicId(),
      invoice_number,
      client_id: input.client_id,
      job_id: input.job_id ?? null,
      payment_status: "Unpaid",
      document_status: "draft",
      due_date: input.due_date ?? null,
      terms: input.terms ?? settings?.default_invoice_terms ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("invoice_items").insert(
    input.lines.map((line, i) => ({
      invoice_id: invoice.id,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      sort_order: i,
    })),
  );

  revalidatePath("/admin/invoices");
  return invoice.id as string;
}

export async function duplicateInvoiceAction(id: string) {
  await duplicateInvoice(id);
}

async function duplicateInvoice(id: string) {
  const supabase = await createClient();
  const { data: inv } = await supabase.from("invoices").select("*").eq("id", id).single();
  const { data: items } = await supabase.from("invoice_items").select("*").eq("invoice_id", id);
  if (!inv) throw new Error("Invoice not found");
  return createInvoiceDraft({
    client_id: inv.client_id,
    due_date: inv.due_date ?? undefined,
    terms: inv.terms ?? undefined,
    lines: (items ?? []).map((l) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unit_price: Number(l.unit_price),
    })),
  });
}
