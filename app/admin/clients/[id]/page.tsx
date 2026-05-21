export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ClientEditor } from "@/components/admin/client-editor";
import { createServiceSupabase } from "@/lib/supabase/service";
import type { ClientRow } from "@/lib/db-types";

export const metadata = { title: "Client" };

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceSupabase();
  const { data } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return <ClientEditor client={data as ClientRow} />;
}
