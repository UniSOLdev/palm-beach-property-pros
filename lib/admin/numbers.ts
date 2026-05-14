import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function nextQuoteNumber(): Promise<string> {
  const sb = createSupabaseAdminClient();
  if (!sb) return `PBPP-Q-${Date.now()}`;
  const { data, error } = await sb.from("quotes").select("quote_number").order("created_at", { ascending: false }).limit(50);
  if (error || !data?.length) return `PBPP-Q-${Date.now()}`;
  const nums = (data as { quote_number: string }[])
    .map((r) => {
      const m = /^PBPP-Q-(\d+)$/.exec(r.quote_number);
      return m ? Number(m[1]) : NaN;
    })
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `PBPP-Q-${next}`;
}

export async function nextInvoiceNumber(): Promise<string> {
  const sb = createSupabaseAdminClient();
  if (!sb) return `PBPP-INV-${Date.now()}`;
  const { data, error } = await sb.from("invoices").select("invoice_number").order("created_at", { ascending: false }).limit(50);
  if (error || !data?.length) return `PBPP-INV-${Date.now()}`;
  const nums = (data as { invoice_number: string }[])
    .map((r) => {
      const m = /^PBPP-INV-(\d+)$/.exec(r.invoice_number);
      return m ? Number(m[1]) : NaN;
    })
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 2100) + 1;
  return `PBPP-INV-${next}`;
}
