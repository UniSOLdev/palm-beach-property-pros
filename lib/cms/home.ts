import { createClient } from "@/lib/supabase/server";

/** Defaults for admin CMS editor — public homepage uses PremiumHomePage component. */
export const HOME_CMS_DEFAULTS: Record<string, Record<string, unknown>> = {
  hero: {
    headline: "Property Care for Palm Beach Living",
    subheadline:
      "Residential, commercial, and coastal property services delivered with professional crews, modern systems, and detail-focused execution.",
    trust_bullets: [
      "Licensed & insured",
      "Residential & commercial",
      "Airbnb & turnover specialists",
      "Palm Beach County based",
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

/** Admin / Site Studio only — do not import from app/(site)/page.tsx or PremiumHomePage. */
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
