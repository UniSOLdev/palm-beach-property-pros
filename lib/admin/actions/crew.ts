"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateCrew() {
  revalidatePath("/admin/crew");
  revalidatePath("/admin/hub");
}

export type SaveCrewInput = {
  id?: string;
  name: string;
  phone?: string | null;
  role?: string | null;
  default_pay_rate?: number;
  pay_rate_unit?: string;
  referral_bonus_flat?: number;
  referral_bonus_percent?: number;
  notes?: string | null;
};

export async function saveCrewMember(input: SaveCrewInput) {
  const supabase = await createClient();
  const row = {
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    role: input.role?.trim() || null,
    default_pay_rate: input.default_pay_rate ?? 0,
    pay_rate_unit: input.pay_rate_unit?.trim() || "hour",
    referral_bonus_flat: input.referral_bonus_flat ?? 25,
    referral_bonus_percent: input.referral_bonus_percent ?? 0,
    notes: input.notes?.trim() || null,
  };

  if (!row.name) throw new Error("Name is required.");

  if (input.id) {
    const { error } = await supabase.from("crew_members").update(row).eq("id", input.id);
    if (error) throw new Error(error.message);
    revalidateCrew();
    return input.id;
  }

  const { data, error } = await supabase.from("crew_members").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  revalidateCrew();
  return data.id as string;
}

export async function archiveCrewMember(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("crew_members").update({ archived: true }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateCrew();
}
