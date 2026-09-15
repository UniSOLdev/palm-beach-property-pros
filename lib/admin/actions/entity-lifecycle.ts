"use server";

import { revalidatePath } from "next/cache";
import { logEntityActivity, listEntityActivity } from "@/lib/admin/lifecycle/activity";
import { entityEditPath } from "@/lib/admin/lifecycle/constants";
import {
  archiveEntity,
  restoreDeletedEntity,
  softDeleteEntity,
  unarchiveEntity,
} from "@/lib/admin/lifecycle/mutations";
import type { AdminEntityType } from "@/lib/admin/lifecycle/types";
import { createClient } from "@/lib/supabase/server";

export async function archiveEntityAction(entityType: AdminEntityType, entityId: string, summary?: string) {
  const supabase = await createClient();
  await archiveEntity(supabase, entityType, entityId, summary);
}

export async function unarchiveEntityAction(entityType: AdminEntityType, entityId: string) {
  const supabase = await createClient();
  await unarchiveEntity(supabase, entityType, entityId);
}

export async function softDeleteEntityAction(entityType: AdminEntityType, entityId: string, summary?: string) {
  const supabase = await createClient();
  await softDeleteEntity(supabase, entityType, entityId, summary);
}

export async function restoreEntityAction(entityType: AdminEntityType, entityId: string) {
  const supabase = await createClient();
  await restoreDeletedEntity(supabase, entityType, entityId);
}

export async function listEntityActivityAction(entityType: AdminEntityType, entityId: string) {
  const supabase = await createClient();
  return listEntityActivity(supabase, entityType, entityId);
}

export async function duplicateEntityAction(entityType: AdminEntityType, entityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Admin authentication required.");

  let newId: string;

  switch (entityType) {
    case "invoice": {
      const { duplicateInvoiceInternal } = await import("@/lib/admin/actions/invoices");
      newId = await duplicateInvoiceInternal(entityId);
      break;
    }
    case "quote": {
      newId = await duplicateQuoteInternal(supabase, entityId, user.id);
      break;
    }
    case "lead": {
      newId = await duplicateLeadInternal(supabase, entityId, user.id);
      break;
    }
    case "job": {
      newId = await duplicateJobInternal(supabase, entityId, user.id);
      break;
    }
    case "task": {
      newId = await duplicateTaskInternal(supabase, entityId, user.id);
      break;
    }
    case "expense": {
      newId = await duplicateExpenseInternal(supabase, entityId, user.id);
      break;
    }
    case "client": {
      newId = await duplicateClientInternal(supabase, entityId, user.id);
      break;
    }
    default:
      throw new Error("Duplicate not supported for this entity.");
  }

  await logEntityActivity(supabase, {
    entityType,
    entityId: newId,
    action: "duplicated",
    summary: `Duplicated from ${entityId.slice(0, 8)}…`,
    metadata: { source_id: entityId },
    userId: user.id,
  });

  revalidatePath(entityEditPath(entityType, newId) ?? "/admin");
  return { id: newId };
}

function newPublicId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

async function duplicateQuoteInternal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  userId: string,
) {
  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).single();
  if (!quote) throw new Error("Quote not found");
  const { data: items } = await supabase.from("quote_items").select("*").eq("quote_id", id);

  const { count } = await supabase.from("quotes").select("id", { count: "exact", head: true }).is("deleted_at", null);
  const quote_number = `Q-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data: created, error } = await supabase
    .from("quotes")
    .insert({
      public_id: newPublicId(),
      quote_number,
      client_id: quote.client_id,
      service_type: quote.service_type,
      job_address: quote.job_address,
      status: "draft",
      approval_status: "pending",
      notes: quote.notes,
      terms: quote.terms,
    })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Quote duplicate failed");

  if (items?.length) {
    await supabase.from("quote_items").insert(
      items.map((line, i) => ({
        quote_id: created.id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        sort_order: i,
      })),
    );
  }

  await logEntityActivity(supabase, {
    entityType: "quote",
    entityId: created.id,
    action: "created",
    summary: "Created as duplicate",
    metadata: { source_id: id },
    userId,
  });

  revalidatePath("/admin/quotes");
  return created.id as string;
}

async function duplicateLeadInternal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  userId: string,
) {
  const { data: lead } = await supabase.from("quote_requests").select("*").eq("id", id).single();
  if (!lead) throw new Error("Lead not found");

  const { data: created, error } = await supabase
    .from("quote_requests")
    .insert({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      service_requested: lead.service_requested,
      address: lead.address,
      city: lead.city,
      property_type: lead.property_type,
      message: lead.message,
      preferred_contact: lead.preferred_contact,
      preferred_date: lead.preferred_date,
      preferred_time: lead.preferred_time,
      photo_urls: lead.photo_urls,
      source: lead.source ?? "duplicate",
      status: "new",
    })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Lead duplicate failed");

  await logEntityActivity(supabase, {
    entityType: "lead",
    entityId: created.id,
    action: "created",
    summary: "Duplicated lead intake",
    metadata: { source_id: id },
    userId,
  });

  revalidatePath("/admin/leads");
  return created.id as string;
}

async function duplicateJobInternal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  userId: string,
) {
  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).single();
  if (!job) throw new Error("Job not found");

  const { data: created, error } = await supabase
    .from("jobs")
    .insert({
      client_id: job.client_id,
      address: job.address,
      status: "Scheduled",
      job_date: job.job_date,
      start_time: job.start_time,
      end_time: job.end_time,
      job_notes: job.job_notes,
      service_type: job.service_type,
    })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Job duplicate failed");

  await logEntityActivity(supabase, {
    entityType: "job",
    entityId: created.id,
    action: "created",
    summary: "Duplicated job",
    metadata: { source_id: id },
    userId,
  });

  revalidatePath("/admin/jobs");
  return created.id as string;
}

async function duplicateTaskInternal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  userId: string,
) {
  const { data: task } = await supabase.from("tasks").select("*").eq("id", id).single();
  if (!task) throw new Error("Task not found");

  const { data: maxSort } = await supabase
    .from("tasks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: created, error } = await supabase
    .from("tasks")
    .insert({
      title: `${task.title} (copy)`,
      description: task.description,
      status: "todo",
      priority: task.priority,
      due_date: task.due_date,
      category: task.category,
      job_id: task.job_id,
      client_id: task.client_id,
      invoice_id: task.invoice_id,
      expense_id: task.expense_id,
      change_order_id: task.change_order_id,
      sort_order: (maxSort?.sort_order ?? 0) + 1,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Task duplicate failed");

  revalidatePath("/admin/tasks");
  return created.id as string;
}

async function duplicateExpenseInternal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  userId: string,
) {
  const { data: expense } = await supabase.from("expenses").select("*").eq("id", id).single();
  if (!expense) throw new Error("Expense not found");

  const { data: created, error } = await supabase
    .from("expenses")
    .insert({
      amount: expense.amount,
      category: expense.category,
      description: `${expense.description} (copy)`,
      expense_date: expense.expense_date,
      expense_type: expense.expense_type,
      job_id: expense.job_id,
      vendor: expense.vendor,
      payment_method: expense.payment_method,
      notes: expense.notes,
      reimbursable: expense.reimbursable,
      reimbursed: false,
      is_recurring: expense.is_recurring,
      recurring_interval: expense.recurring_interval,
    })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Expense duplicate failed");

  await logEntityActivity(supabase, {
    entityType: "expense",
    entityId: created.id,
    action: "created",
    summary: "Duplicated expense",
    metadata: { source_id: id },
    userId,
  });

  revalidatePath("/admin/expenses");
  return created.id as string;
}

async function duplicateClientInternal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  userId: string,
) {
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) throw new Error("Client not found");

  const { data: created, error } = await supabase
    .from("clients")
    .insert({
      name: `${client.name} (copy)`,
      phone: client.phone,
      email: client.email,
      address: client.address,
      client_type: client.client_type,
      referral_source: client.referral_source,
      notes: client.notes,
      review_status: client.review_status,
    })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Client duplicate failed");

  await logEntityActivity(supabase, {
    entityType: "client",
    entityId: created.id,
    action: "created",
    summary: "Duplicated client record",
    metadata: { source_id: id },
    userId,
  });

  revalidatePath("/admin/clients");
  return created.id as string;
}
