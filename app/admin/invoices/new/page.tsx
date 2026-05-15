export const dynamic = "force-dynamic";

import { InvoiceNewForm } from "@/components/admin/invoice-new-form";
import { fetchRecentClientsForCombobox } from "@/lib/admin-recent-clients";
import type { ClientSummary } from "@/components/admin/client-combobox";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata = {
  title: "New invoice",
};

async function fetchClientById(id: string): Promise<ClientSummary | null> {
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("clients")
      .select("id, full_name, phone, email, created_at")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as ClientSummary;
  } catch {
    return null;
  }
}

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string; from_quote?: string }>;
}) {
  const sp = await searchParams;
  const preselectClientId = sp.client_id?.trim() || null;
  const fromQuote = sp.from_quote === "1";
  const quoteNote =
    fromQuote && preselectClientId
      ? "Quote → invoice: client relation preserved via client_id for operational history."
      : fromQuote
        ? "Quote → invoice: select a client to preserve CRM linkage and history."
        : null;

  let recentClients: Awaited<ReturnType<typeof fetchRecentClientsForCombobox>> = [];
  let dbWarning: string | null = null;
  let initialClient: ClientSummary | null = null;

  try {
    recentClients = await fetchRecentClientsForCombobox();
    if (preselectClientId) {
      initialClient = await fetchClientById(preselectClientId);
    }
  } catch (e) {
    dbWarning = e instanceof Error ? e.message : "Could not load Supabase.";
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">New invoice</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Link a CRM client to persist <code className="text-zinc-400">client_id</code> on the
          invoice record.
        </p>
      </div>

      {dbWarning ? (
        <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium">Supabase unavailable</p>
          <p className="mt-1 text-amber-100/80">{dbWarning}</p>
          <p className="mt-2 text-xs text-amber-200/70">
            Set <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-black/30 px-1">SUPABASE_SERVICE_ROLE_KEY</code> in the
            environment, then apply the SQL migration in{" "}
            <code className="rounded bg-black/30 px-1">supabase/migrations</code>.
          </p>
        </div>
      ) : null}

      <InvoiceNewForm
        recentClients={recentClients}
        initialClient={initialClient}
        quoteNote={quoteNote}
      />
    </div>
  );
}
