import type { ClientSummary } from "@/components/admin/client-combobox";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function fetchClientSummaryById(id: string): Promise<ClientSummary | null> {
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
