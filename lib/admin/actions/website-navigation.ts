"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type NavItem = Database["public"]["Tables"]["cms_navigation"]["Row"];

export async function listSiteNavigation() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cms_navigation")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function saveSiteNavigation(
  items: Array<{ id?: string; label: string; href: string; is_visible: boolean; sort_order: number }>,
) {
  const supabase = await createClient();

  const { data: existing } = await supabase.from("cms_navigation").select("id");
  const existingIds = new Set((existing ?? []).map((r) => r.id));

  for (const item of items) {
    if (item.id && existingIds.has(item.id)) {
      const { error } = await supabase
        .from("cms_navigation")
        .update({
          label: item.label,
          href: item.href,
          is_visible: item.is_visible,
          sort_order: item.sort_order,
        })
        .eq("id", item.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("cms_navigation").insert({
        label: item.label,
        href: item.href,
        is_visible: item.is_visible,
        sort_order: item.sort_order,
      });
      if (error) throw new Error(error.message);
    }
  }

  const keepIds = new Set(items.map((i) => i.id).filter(Boolean) as string[]);
  for (const id of existingIds) {
    if (!keepIds.has(id)) {
      await supabase.from("cms_navigation").delete().eq("id", id);
    }
  }

  revalidatePath("/admin/website");
}
