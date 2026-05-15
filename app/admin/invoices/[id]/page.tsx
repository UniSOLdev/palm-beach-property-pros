export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { InvoiceEditor } from "@/components/admin/invoice-editor";
import { createServiceSupabase } from "@/lib/supabase/service";
import type { InvoiceRow } from "@/lib/db-types";

export const metadata = { title: "Edit invoice" };

export default async function AdminInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from("invoices")
    .select("*, clients(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  return <InvoiceEditor invoice={data as InvoiceRow & { clients?: { full_name: string } | null }} />;
}
