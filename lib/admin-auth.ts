import { cookies } from "next/headers";
import { getAdminSessionTokenValue } from "@/lib/admin-token";

export const ADMIN_SESSION_COOKIE = "pbpp_admin_session";

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const store = await cookies();
  const v = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!v) return false;
  const expected = await getAdminSessionTokenValue();
  return v === expected;
}
