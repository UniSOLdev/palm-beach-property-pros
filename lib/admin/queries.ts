import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  mapBusinessSettingsRow,
  mapClientRow,
  mapCrewMemberRow,
  mapCrewPayoutRow,
  mapExpenseRow,
  mapInvoiceRow,
  mapJobRow,
  mapQuoteRow,
  mapSopTemplateFromRows,
  mapSupplyRow,
} from "@/lib/admin/mappers";
import { monthBounds } from "@/lib/admin/expense-analytics";
import { adminSeed, getClientById as seedGetClientById, getSopBySlug as seedGetSopBySlug } from "@/lib/admin/seed";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";
import type {
  BusinessSettings,
  Client,
  CrewMember,
  CrewPayout,
  Expense,
  Invoice,
  Job,
  Quote,
  SopTemplate,
  Supply,
} from "@/lib/admin/types";

function logDb(context: string, err: unknown) {
  console.error(`[pbpp-db] ${context}`, err);
}

async function sumJobSpecificExpensesByJobIds(jobIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!jobIds.length) return map;
  const sb = createSupabaseAdminClient();
  if (!sb) return map;
  const { data, error } = await sb
    .from("expenses")
    .select("job_id, amount")
    .in("job_id", jobIds)
    .eq("expense_type", "Job-specific")
    .eq("archived", false);
  if (error || !data) {
    if (error) logDb("sumJobSpecificExpensesByJobIds", error);
    return map;
  }
  for (const row of data as { job_id: string | null; amount: number | string | null }[]) {
    if (!row.job_id) continue;
    const amt = typeof row.amount === "number" ? row.amount : Number(row.amount ?? 0);
    map.set(row.job_id, (map.get(row.job_id) ?? 0) + (Number.isFinite(amt) ? amt : 0));
  }
  return map;
}

async function fetchQuoteItemsForQuotes(quoteIds: string[]) {
  const sb = createSupabaseAdminClient();
  if (!sb || !quoteIds.length) return new Map<string, Record<string, unknown>[]>();
  const { data, error } = await sb
    .from("quote_items")
    .select("id, quote_id, description, quantity, unit_price, is_addon, sort_order")
    .in("quote_id", quoteIds);
  if (error || !data) {
    if (error) logDb("fetchQuoteItemsForQuotes", error);
    return new Map();
  }
  const map = new Map<string, Record<string, unknown>[]>();
  for (const row of data as Record<string, unknown>[]) {
    const qid = String(row.quote_id);
    const arr = map.get(qid) ?? [];
    arr.push(row);
    map.set(qid, arr);
  }
  return map;
}

async function fetchInvoiceItemsForInvoices(invoiceIds: string[]) {
  const sb = createSupabaseAdminClient();
  if (!sb || !invoiceIds.length) return new Map<string, Record<string, unknown>[]>();
  const { data, error } = await sb
    .from("invoice_items")
    .select("id, invoice_id, description, quantity, unit_price, sort_order")
    .in("invoice_id", invoiceIds);
  if (error || !data) {
    if (error) logDb("fetchInvoiceItemsForInvoices", error);
    return new Map();
  }
  const map = new Map<string, Record<string, unknown>[]>();
  for (const row of data as Record<string, unknown>[]) {
    const iid = String(row.invoice_id);
    const arr = map.get(iid) ?? [];
    arr.push(row);
    map.set(iid, arr);
  }
  return map;
}

export async function listClients(): Promise<Client[]> {
  if (!isSupabaseServerConfigured()) return adminSeed.clients;
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.clients;
  const { data, error } = await sb
    .from("clients")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });
  if (error || !data) {
    if (error) logDb("listClients", error);
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapClientRow);
}

export async function getClientById(id: string): Promise<Client | undefined> {
  if (!isSupabaseServerConfigured()) return seedGetClientById(id);
  const sb = createSupabaseAdminClient();
  if (!sb) return seedGetClientById(id);
  const { data, error } = await sb.from("clients").select("*").eq("id", id).maybeSingle();
  if (error || !data) {
    if (error) logDb("getClientById", error);
    return undefined;
  }
  const row = data as Record<string, unknown>;
  if (row.archived) return undefined;
  return mapClientRow(row);
}

export async function listJobs(): Promise<Job[]> {
  if (!isSupabaseServerConfigured()) return adminSeed.jobs;
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.jobs;
  const { data, error } = await sb
    .from("jobs")
    .select("*")
    .eq("archived", false)
    .order("job_date", { ascending: false });
  if (error || !data) {
    if (error) logDb("listJobs", error);
    return [];
  }
  const rows = data as Record<string, unknown>[];
  const ids = rows.map((r) => String(r.id));
  const sums = await sumJobSpecificExpensesByJobIds(ids);
  return rows.map((r) => mapJobRow(r, sums.get(String(r.id)) ?? 0));
}

export async function getJobById(id: string): Promise<Job | undefined> {
  if (!isSupabaseServerConfigured()) return adminSeed.jobs.find((j) => j.id === id);
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.jobs.find((j) => j.id === id);
  const { data, error } = await sb.from("jobs").select("*").eq("id", id).maybeSingle();
  if (error || !data) {
    if (error) logDb("getJobById", error);
    return undefined;
  }
  const row = data as Record<string, unknown>;
  if (row.archived) return undefined;
  const sums = await sumJobSpecificExpensesByJobIds([id]);
  return mapJobRow(row, sums.get(id) ?? 0);
}

export async function listJobExpensesForJob(jobId: string): Promise<Expense[]> {
  if (!isSupabaseServerConfigured()) return adminSeed.expenses.filter((e) => e.jobId === jobId);
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.expenses.filter((e) => e.jobId === jobId);
  const { data, error } = await sb
    .from("expenses")
    .select("*")
    .eq("job_id", jobId)
    .eq("archived", false)
    .order("expense_date", { ascending: false });
  if (error || !data) {
    if (error) logDb("listJobExpensesForJob", error);
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapExpenseRow);
}

export async function listQuotes(): Promise<Quote[]> {
  if (!isSupabaseServerConfigured()) return adminSeed.quotes;
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.quotes;
  const { data, error } = await sb
    .from("quotes")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });
  if (error || !data) {
    if (error) logDb("listQuotes", error);
    return [];
  }
  const rows = data as Record<string, unknown>[];
  const ids = rows.map((r) => String(r.id));
  const itemsMap = await fetchQuoteItemsForQuotes(ids);
  return rows.map((r) => {
    const items = (itemsMap.get(String(r.id)) ?? []) as Parameters<typeof mapQuoteRow>[1];
    return mapQuoteRow(r, items);
  });
}

export async function getQuoteById(id: string): Promise<Quote | undefined> {
  if (!isSupabaseServerConfigured()) return adminSeed.quotes.find((q) => q.id === id);
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.quotes.find((q) => q.id === id);
  const { data, error } = await sb.from("quotes").select("*").eq("id", id).maybeSingle();
  if (error || !data) {
    if (error) logDb("getQuoteById", error);
    return undefined;
  }
  const row = data as Record<string, unknown>;
  if (row.archived) return undefined;
  const itemsMap = await fetchQuoteItemsForQuotes([id]);
  const items = (itemsMap.get(id) ?? []) as Parameters<typeof mapQuoteRow>[1];
  return mapQuoteRow(row, items);
}

export async function getQuoteByPublicId(publicId: string): Promise<Quote | undefined> {
  if (!isSupabaseServerConfigured()) return adminSeed.quotes.find((q) => q.publicId === publicId);
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.quotes.find((q) => q.publicId === publicId);
  const { data, error } = await sb.from("quotes").select("*").eq("public_id", publicId).maybeSingle();
  if (error || !data) {
    if (error) logDb("getQuoteByPublicId", error);
    return undefined;
  }
  const row = data as Record<string, unknown>;
  if (row.archived) return undefined;
  const id = String(row.id);
  const itemsMap = await fetchQuoteItemsForQuotes([id]);
  const items = (itemsMap.get(id) ?? []) as Parameters<typeof mapQuoteRow>[1];
  return mapQuoteRow(row, items);
}

export async function listInvoices(): Promise<Invoice[]> {
  if (!isSupabaseServerConfigured()) return adminSeed.invoices;
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.invoices;
  const { data, error } = await sb
    .from("invoices")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });
  if (error || !data) {
    if (error) logDb("listInvoices", error);
    return [];
  }
  const rows = data as Record<string, unknown>[];
  const ids = rows.map((r) => String(r.id));
  const itemsMap = await fetchInvoiceItemsForInvoices(ids);
  return rows.map((r) => {
    const items = (itemsMap.get(String(r.id)) ?? []) as Parameters<typeof mapInvoiceRow>[1];
    return mapInvoiceRow(r, items);
  });
}

export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  if (!isSupabaseServerConfigured()) return adminSeed.invoices.find((i) => i.id === id);
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.invoices.find((i) => i.id === id);
  const { data, error } = await sb.from("invoices").select("*").eq("id", id).maybeSingle();
  if (error || !data) {
    if (error) logDb("getInvoiceById", error);
    return undefined;
  }
  const row = data as Record<string, unknown>;
  if (row.archived) return undefined;
  const itemsMap = await fetchInvoiceItemsForInvoices([id]);
  const items = (itemsMap.get(id) ?? []) as Parameters<typeof mapInvoiceRow>[1];
  return mapInvoiceRow(row, items);
}

export async function getInvoiceByPublicId(publicId: string): Promise<Invoice | undefined> {
  if (!isSupabaseServerConfigured()) return adminSeed.invoices.find((i) => i.publicId === publicId);
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.invoices.find((i) => i.publicId === publicId);
  const { data, error } = await sb.from("invoices").select("*").eq("public_id", publicId).maybeSingle();
  if (error || !data) {
    if (error) logDb("getInvoiceByPublicId", error);
    return undefined;
  }
  const row = data as Record<string, unknown>;
  if (row.archived) return undefined;
  const id = String(row.id);
  const itemsMap = await fetchInvoiceItemsForInvoices([id]);
  const items = (itemsMap.get(id) ?? []) as Parameters<typeof mapInvoiceRow>[1];
  return mapInvoiceRow(row, items);
}

export type ExpenseListFilters = {
  category?: string;
  expenseType?: string;
  paymentMethod?: string;
  jobId?: string;
  /** YYYY-MM; when set, overrides loose from/to for the calendar month */
  month?: string;
  from?: string;
  to?: string;
  search?: string;
  sort?: "date" | "amount";
  order?: "asc" | "desc";
};

function applyExpenseListFilters(rows: Expense[], filters?: ExpenseListFilters): Expense[] {
  let out = [...rows];
  if (filters?.category) out = out.filter((e) => e.category === filters.category);
  if (filters?.expenseType) out = out.filter((e) => e.expenseType === filters.expenseType);
  if (filters?.paymentMethod) out = out.filter((e) => e.paymentMethod === filters.paymentMethod);
  if (filters?.jobId) out = out.filter((e) => e.jobId === filters.jobId);

  if (filters?.month) {
    const b = monthBounds(filters.month);
    if (b) out = out.filter((e) => e.date >= b.from && e.date <= b.to);
  } else {
    if (filters?.from) out = out.filter((e) => e.date >= filters.from!);
    if (filters?.to) out = out.filter((e) => e.date <= filters.to!);
  }

  const q = filters?.search?.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (e) =>
        e.vendor.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q),
    );
  }

  const sortKey = filters?.sort === "amount" ? "amount" : "date";
  const asc = filters?.order === "asc";
  out.sort((a, b) => {
    const cmp =
      sortKey === "amount"
        ? a.amount - b.amount
        : a.date.localeCompare(b.date) || b.createdAt.localeCompare(a.createdAt);
    return asc ? cmp : -cmp;
  });

  return out;
}

export async function listExpenses(filters?: ExpenseListFilters): Promise<Expense[]> {
  if (!isSupabaseServerConfigured()) {
    return applyExpenseListFilters(adminSeed.expenses, filters);
  }
  const sb = createSupabaseAdminClient();
  if (!sb) return applyExpenseListFilters(adminSeed.expenses, filters);

  const { data, error } = await sb.from("expenses").select("*").eq("archived", false);
  if (error || !data) {
    if (error) logDb("listExpenses", error);
    return [];
  }
  const mapped = (data as Record<string, unknown>[]).map(mapExpenseRow);
  return applyExpenseListFilters(mapped, filters);
}

export async function getExpenseById(id: string): Promise<Expense | undefined> {
  if (!isSupabaseServerConfigured()) return adminSeed.expenses.find((e) => e.id === id);
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.expenses.find((e) => e.id === id);
  const { data, error } = await sb.from("expenses").select("*").eq("id", id).maybeSingle();
  if (error || !data) {
    if (error) logDb("getExpenseById", error);
    return undefined;
  }
  const row = data as Record<string, unknown>;
  if (row.archived) return undefined;
  return mapExpenseRow(row);
}

export async function listSupplies(): Promise<Supply[]> {
  if (!isSupabaseServerConfigured()) return adminSeed.supplies;
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.supplies;
  const { data, error } = await sb
    .from("supplies")
    .select("*")
    .eq("archived", false)
    .order("name", { ascending: true });
  if (error || !data) {
    if (error) logDb("listSupplies", error);
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapSupplyRow);
}

export async function listCrewMembers(): Promise<CrewMember[]> {
  if (!isSupabaseServerConfigured()) return adminSeed.crewMembers;
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.crewMembers;
  const { data, error } = await sb
    .from("crew_members")
    .select("*")
    .eq("archived", false)
    .order("name", { ascending: true });
  if (error || !data) {
    if (error) logDb("listCrewMembers", error);
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapCrewMemberRow);
}

export async function listCrewPayouts(): Promise<CrewPayout[]> {
  if (!isSupabaseServerConfigured()) return adminSeed.crewPayouts;
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.crewPayouts;
  const { data, error } = await sb.from("crew_payouts").select("*").order("created_at", { ascending: false });
  if (error || !data) {
    if (error) logDb("listCrewPayouts", error);
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapCrewPayoutRow);
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  if (!isSupabaseServerConfigured()) return adminSeed.businessSettings;
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.businessSettings;
  const { data, error } = await sb.from("business_settings").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !data) {
    if (error) logDb("getBusinessSettings", error);
    return adminSeed.businessSettings;
  }
  return mapBusinessSettingsRow(data as Record<string, unknown>);
}

export async function listSopTemplates(): Promise<SopTemplate[]> {
  if (!isSupabaseServerConfigured()) return adminSeed.sopTemplates;
  const sb = createSupabaseAdminClient();
  if (!sb) return adminSeed.sopTemplates;
  const { data: templates, error } = await sb.from("sop_templates").select("*").order("title", { ascending: true });
  if (error || !templates || templates.length === 0) {
    if (error) logDb("listSopTemplates", error);
    return adminSeed.sopTemplates;
  }
  const tRows = templates as Record<string, unknown>[];
  const ids = tRows.map((t) => String(t.id));
  const { data: checklist, error: cErr } = await sb
    .from("sop_checklists")
    .select("sop_template_id, section, items, sort_order")
    .in("sop_template_id", ids);
  if (cErr || !checklist) {
    if (cErr) logDb("listSopTemplates.checklists", cErr);
    return adminSeed.sopTemplates;
  }
  const byTemplate = new Map<string, { section: string; items: unknown; sort_order: number }[]>();
  for (const row of checklist as Record<string, unknown>[]) {
    const tid = String(row.sop_template_id);
    const arr = byTemplate.get(tid) ?? [];
    arr.push({
      section: String(row.section),
      items: row.items,
      sort_order: Number(row.sort_order ?? 0),
    });
    byTemplate.set(tid, arr);
  }
  const mapped = tRows.map((t) => {
    const tid = String(t.id);
    const rows = (byTemplate.get(tid) ?? []).sort((a, b) => a.sort_order - b.sort_order);
    return mapSopTemplateFromRows(t, rows);
  });

  const emptyPlaybooks = mapped.every(
    (s) => s.steps.length === 0 && s.qualityControl.length === 0 && s.photoChecklist.length === 0 && s.completion.length === 0,
  );
  if (emptyPlaybooks) return adminSeed.sopTemplates;
  return mapped;
}

export async function getSopBySlug(slug: string): Promise<SopTemplate | undefined> {
  const fromDb = (await listSopTemplates()).find((s) => s.slug === slug);
  if (fromDb) return fromDb;
  return seedGetSopBySlug(slug);
}

export async function getOperationsDataset() {
  const [clients, jobs, quotes, invoices, expenses, supplies, crewMembers, crewPayouts, businessSettings] =
    await Promise.all([
      listClients(),
      listJobs(),
      listQuotes(),
      listInvoices(),
      listExpenses(),
      listSupplies(),
      listCrewMembers(),
      listCrewPayouts(),
      getBusinessSettings(),
    ]);
  const sopTemplates = await listSopTemplates();
  return {
    businessSettings,
    clients,
    jobs,
    quotes,
    invoices,
    expenses,
    sopTemplates,
    supplies,
    crewMembers,
    crewPayouts,
  };
}
