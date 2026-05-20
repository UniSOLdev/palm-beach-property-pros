import { createClient } from "@/lib/supabase/server";

export const HOME_CMS_DEFAULTS: Record<string, Record<string, unknown>> = {
  hero: {
    headline: "Palm Beach County Property Care — Done Right.",
    subheadline:
      "Premium window cleaning, pressure washing, detailing, and property maintenance trusted by homeowners and businesses across Palm Beach County.",
    trust_bullets: [
      "Licensed & Insured",
      "Local Palm Beach County Team",
      "Written Scope Confirmation Before Service",
    ],
  },
  trust_band: {
    cities: [
      "West Palm Beach",
      "Palm Beach Gardens",
      "Jupiter",
      "Delray Beach",
      "Boynton Beach",
      "North Palm Beach",
      "Juno Beach",
    ],
    items: [
      { icon: "⭐", label: "5-Star Local Service" },
      { icon: "📷", label: "Photo-Based Estimates" },
      { icon: "🛡", label: "Surface-Safe Methods" },
    ],
  },
  results_gallery: { items: [] as { label: string; image_url?: string }[] },
};

export async function getHomeCmsSections(): Promise<Record<string, Record<string, unknown>>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cms_sections")
      .select("section_key, content")
      .eq("page_key", "home")
      .eq("is_visible", true);

    const merged: Record<string, Record<string, unknown>> = { ...HOME_CMS_DEFAULTS };
    for (const row of data ?? []) {
      merged[row.section_key] = {
        ...HOME_CMS_DEFAULTS[row.section_key],
        ...(row.content as Record<string, unknown>),
      };
    }
    return merged;
  } catch {
    return HOME_CMS_DEFAULTS;
  }
}
