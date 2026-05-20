"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { APPROVAL_TERMS_VERSION } from "@/lib/admin/change-order-constants";
import { calculateChangeOrderTotals, changeOrderPublicUrl, lineTotal } from "@/lib/admin/change-order-utils";
import type { ChangeOrderRow, ChangeOrderItemRow, SaveChangeOrderInput } from "@/lib/admin/types-change-orders";

function newPublicId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

function revalidateChangeOrderPaths(jobId?: string | null, coId?: string | null) {
  revalidatePath("/admin/change-orders");
  if (coId) revalidatePath(`/admin/change-orders/${coId}`);
  if (jobId) revalidatePath(`/admin/jobs/${jobId}`);
}

async function nextChangeOrderNumber(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { count } = await supabase.from("change_orders").select("id", { count: "exact", head: true });
  return `CO-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

function buildApprovalSnapshot(co: {
  title: string;
  scope_change_reason: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  change_order_number: string;
  lines: { description: string; quantity: number; unit_price: number; line_total: number }[];
}) {
  return {
    version: APPROVAL_TERMS_VERSION,
    captured_at: new Date().toISOString(),
    change_order_number: co.change_order_number,
    title: co.title,
    scope_change_reason: co.scope_change_reason,
    subtotal: co.subtotal,
    tax_amount: co.tax_amount,
    total: co.total,
    lines: co.lines,
  };
}

export async function listChangeOrders(): Promise<ChangeOrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("change_orders")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ChangeOrderRow[];
}

export async function listChangeOrdersForJob(jobId: string): Promise<ChangeOrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("change_orders")
    .select("*")
    .eq("job_id", jobId)
    .eq("archived", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ChangeOrderRow[];
}

export async function getChangeOrderDetail(id: string): Promise<{
  order: ChangeOrderRow;
  items: ChangeOrderItemRow[];
  jobLabel: string | null;
  clientLabel: string | null;
} | null> {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("change_orders")
    .select("*, jobs(service_type, address), clients(name)")
    .eq("id", id)
    .eq("archived", false)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) return null;

  const { data: items } = await supabase
    .from("change_order_items")
    .select("*")
    .eq("change_order_id", id)
    .order("sort_order");

  const job = order.jobs as { service_type?: string; address?: string } | null;
  const client = order.clients as { name?: string } | null;
  const { jobs: _j, clients: _c, ...row } = order;

  return {
    order: row as ChangeOrderRow,
    items: (items ?? []) as ChangeOrderItemRow[],
    jobLabel: job ? `${job.service_type} · ${job.address}` : null,
    clientLabel: client?.name ?? null,
  };
}

export async function getChangeOrderPrefillFromJob(jobId: string) {
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, client_id, service_type, address, job_notes, clients(name, phone, email)")
    .eq("id", jobId)
    .eq("archived", false)
    .maybeSingle();
  if (!job) throw new Error("Job not found");
  const client = job.clients as { name?: string; phone?: string | null; email?: string | null } | null;
  return {
    job_id: job.id,
    client_id: job.client_id,
    title: `Change Order — ${job.service_type}`,
    scope_change_reason: "",
    notes: job.job_notes ? `Original scope: ${job.job_notes.slice(0, 200)}` : "",
    client_name: client?.name ?? "",
    client_email: client?.email ?? "",
    client_phone: client?.phone ?? "",
    address: job.address,
    service_type: job.service_type,
  };
}

export async function saveChangeOrder(input: SaveChangeOrderInput): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const lines = input.lines.filter((l) => l.description.trim());
  if (lines.length === 0) throw new Error("Add at least one line item");

  const tax_rate = input.tax_rate ?? 0;
  const totals = calculateChangeOrderTotals(lines, tax_rate);

  const itemRows = lines.map((l, i) => ({
    description: l.description.trim(),
    quantity: l.quantity,
    unit_price: l.unit_price,
    line_total: lineTotal(l.quantity, l.unit_price),
    sort_order: i,
  }));

  if (input.id) {
    const { data: existing } = await supabase
      .from("change_orders")
      .select("status")
      .eq("id", input.id)
      .single();
    if (!existing) throw new Error("Change order not found");
    if (existing.status !== "draft") throw new Error("Only draft change orders can be edited");

    const { error } = await supabase
      .from("change_orders")
      .update({
        job_id: input.job_id,
        client_id: input.client_id,
        title: input.title,
        scope_change_reason: input.scope_change_reason ?? null,
        notes: input.notes ?? null,
        tax_rate,
        subtotal: totals.subtotal,
        tax_amount: totals.tax_amount,
        total: totals.total,
        client_name: input.client_name ?? null,
        client_email: input.client_email ?? null,
        client_phone: input.client_phone ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);
    if (error) throw new Error(error.message);

    await supabase.from("change_order_items").delete().eq("change_order_id", input.id);
    await supabase.from("change_order_items").insert(
      itemRows.map((r) => ({ ...r, change_order_id: input.id! })),
    );

    if (input.mark_sent) await markChangeOrderSent(input.id);
    revalidateChangeOrderPaths(input.job_id, input.id);
    return input.id;
  }

  const { data: created, error } = await supabase
    .from("change_orders")
    .insert({
      public_id: newPublicId(),
      change_order_number: await nextChangeOrderNumber(supabase),
      job_id: input.job_id,
      client_id: input.client_id,
      status: "draft",
      title: input.title,
      scope_change_reason: input.scope_change_reason ?? null,
      notes: input.notes ?? null,
      tax_rate,
      subtotal: totals.subtotal,
      tax_amount: totals.tax_amount,
      total: totals.total,
      client_name: input.client_name ?? null,
      client_email: input.client_email ?? null,
      client_phone: input.client_phone ?? null,
      approval_terms_version: APPROVAL_TERMS_VERSION,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("change_order_items").insert(
    itemRows.map((r) => ({ ...r, change_order_id: created.id })),
  );

  if (input.mark_sent) await markChangeOrderSent(created.id);
  revalidateChangeOrderPaths(input.job_id, created.id);
  return created.id as string;
}

export async function markChangeOrderSent(id: string) {
  const supabase = await createClient();
  const detail = await getChangeOrderDetail(id);
  if (!detail) throw new Error("Change order not found");
  if (detail.order.status === "approved") throw new Error("Already approved");

  const snap = buildApprovalSnapshot({
    title: detail.order.title,
    scope_change_reason: detail.order.scope_change_reason,
    subtotal: Number(detail.order.subtotal),
    tax_amount: Number(detail.order.tax_amount),
    total: Number(detail.order.total),
    change_order_number: detail.order.change_order_number,
    lines: detail.items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      line_total: Number(i.line_total),
    })),
  });

  const { error } = await supabase
    .from("change_orders")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      approval_snapshot_json: snap,
      approval_terms_version: APPROVAL_TERMS_VERSION,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", ["draft", "sent"]);

  if (error) throw new Error(error.message);
  revalidateChangeOrderPaths(detail.order.job_id, id);
  return changeOrderPublicUrl(detail.order.public_id);
}

export async function voidChangeOrder(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("change_orders").select("job_id").eq("id", id).single();
  const { error } = await supabase
    .from("change_orders")
    .update({ status: "void", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateChangeOrderPaths(data?.job_id, id);
}

export async function addApprovedChangeOrderToInvoice(changeOrderId: string, invoiceId?: string) {
  const supabase = await createClient();
  const detail = await getChangeOrderDetail(changeOrderId);
  if (!detail) throw new Error("Change order not found");
  const { order, items } = detail;

  if (order.status !== "approved") throw new Error("Change order must be approved first");
  if (order.invoice_id) throw new Error("Already added to an invoice");

  let targetInvoiceId = invoiceId ?? null;
  if (!targetInvoiceId) {
    const { data: job } = await supabase.from("jobs").select("invoice_id").eq("id", order.job_id).single();
    targetInvoiceId = job?.invoice_id ?? null;
  }
  if (!targetInvoiceId) throw new Error("No invoice linked to this job. Create an invoice first.");

  const { data: existingItems } = await supabase
    .from("invoice_items")
    .select("sort_order")
    .eq("invoice_id", targetInvoiceId)
    .order("sort_order", { ascending: false })
    .limit(1);
  let sort = (existingItems?.[0]?.sort_order ?? -1) + 1;

  const prefix = order.change_order_number;
  const rows = items.map((item) => ({
    invoice_id: targetInvoiceId,
    description: `[${prefix}] ${item.description}`,
    quantity: item.quantity,
    unit_price: item.unit_price,
    sort_order: sort++,
  }));

  const { error: insertErr } = await supabase.from("invoice_items").insert(rows);
  if (insertErr) throw new Error(insertErr.message);

  const { error: linkErr } = await supabase
    .from("change_orders")
    .update({ invoice_id: targetInvoiceId, updated_at: new Date().toISOString() })
    .eq("id", changeOrderId);
  if (linkErr) throw new Error(linkErr.message);

  revalidatePath(`/admin/invoices/${targetInvoiceId}`);
  revalidateChangeOrderPaths(order.job_id, changeOrderId);
  return targetInvoiceId;
}

export async function submitChangeOrderApprovalAction(
  publicId: string,
  action: "approve" | "decline",
  signatureName?: string,
  declineReason?: string,
) {
  const supabase = await createClient();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent");

  const { data, error } = await supabase.rpc("submit_change_order_approval", {
    p_public_id: publicId,
    p_action: action,
    p_signature_name: signatureName ?? null,
    p_decline_reason: declineReason ?? null,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/co/${publicId}`);
  return data as { ok?: boolean; status?: string; already_approved?: boolean };
}

export async function getPublicChangeOrder(publicId: string) {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("change_orders")
    .select(
      "id, job_id, public_id, change_order_number, status, title, scope_change_reason, notes, subtotal, tax_amount, total, client_name, client_email, approval_snapshot_json, approved_at, declined_at, decline_reason, approval_signature_name",
    )
    .eq("public_id", publicId)
    .eq("archived", false)
    .in("status", ["sent", "approved", "declined"])
    .maybeSingle();

  if (error || !order) return null;

  const [{ data: items }, { data: job }] = await Promise.all([
    supabase
      .from("change_order_items")
      .select("description, quantity, unit_price, line_total, sort_order")
      .eq("change_order_id", order.id)
      .order("sort_order"),
    supabase.from("jobs").select("service_type, address").eq("id", order.job_id).maybeSingle(),
  ]);

  return { order, items: items ?? [], job };
}
