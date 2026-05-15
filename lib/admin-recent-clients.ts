import type { ClientSummary } from "@/components/admin/client-combobox";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function fetchRecentClientsForCombobox(): Promise<ClientSummary[]> {
  const supabase = createServiceSupabase();
  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .select("client_id, created_at")
    .not("client_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(80);

  if (invErr) throw invErr;

  const seen = new Set<string>();
  const orderedIds: string[] = [];
  for (const row of inv ?? []) {
    const cid = row.client_id as string;
    if (!cid || seen.has(cid)) continue;
    seen.add(cid);
    orderedIds.push(cid);
    if (orderedIds.length >= 8) break;
  }

  if (orderedIds.length === 0) return [];

  const { data: clients, error: cErr } = await supabase
    .from("clients")
    .select("id, full_name, phone, email, created_at")
    .in("id", orderedIds);

  if (cErr) throw cErr;

  const byId = new Map((clients ?? []).map((c) => [c.id, c as ClientSummary]));
  return orderedIds.map((id) => byId.get(id)).filter(Boolean) as ClientSummary[];
}
