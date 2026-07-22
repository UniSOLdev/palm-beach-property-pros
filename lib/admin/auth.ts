import "server-only";

import { createClient } from "@/lib/supabase/server";

export type UserRole = "owner" | "editor" | "staff";

export async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.role) return data.role as UserRole;
  // Default: first authenticated user treated as owner until roles assigned
  return "owner";
}

export async function requireOwnerRole() {
  const { supabase, user } = await requireAdminUser();
  const role = await getUserRole(user.id);
  if (role !== "owner" && role !== "editor") {
    throw new Error("Insufficient permissions");
  }
  return { supabase, user, role };
}
