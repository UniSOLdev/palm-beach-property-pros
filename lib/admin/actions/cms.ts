"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveCmsSection(
  pageKey: string,
  sectionKey: string,
  content: Record<string, unknown>,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("cms_sections").upsert(
    {
      page_key: pageKey,
      section_key: sectionKey,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "page_key,section_key" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/website");
}
