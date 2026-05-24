import { logAdminError } from "@/lib/admin/logger";

export type DbQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

/** Normalize Supabase/PostgREST errors for admin UI. */
export function formatDbError(error: { message: string; code?: string; details?: string } | null): string {
  if (!error) return "Unknown database error";
  const msg = error.message;
  if (msg.includes("column") && msg.includes("does not exist")) {
    return `Schema mismatch: ${msg}. Contact support or run pending migrations.`;
  }
  if (error.code === "PGRST116") return "Record not found.";
  if (error.code === "42501") return "Permission denied. Sign in again or check RLS policies.";
  return msg;
}

export function fromSupabase<T>(
  data: T | null,
  error: { message: string; code?: string; details?: string } | null,
  context: { route: string; query: string },
): DbQueryResult<T> {
  if (error) {
    logAdminError(`Query failed: ${context.query}`, error, context);
    return { ok: false, error: formatDbError(error), code: error.code };
  }
  return { ok: true, data: data as T };
}
