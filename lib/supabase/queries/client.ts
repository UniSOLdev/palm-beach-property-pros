import type { PostgrestError } from "@supabase/supabase-js";
import { formatDbError } from "@/lib/admin/db-query";
import { logAdminError } from "@/lib/admin/logger";

export type QueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export type QueryContext = {
  route: string;
  query: string;
};

/** Execute a Supabase query and normalize errors for admin/server use. */
export function toQueryResult<T>(
  data: T | null,
  error: PostgrestError | null,
  context: QueryContext,
): QueryResult<T> {
  if (error) {
    logAdminError(`Query failed: ${context.query}`, error, context);
    return { ok: false, error: formatDbError(error), code: error.code };
  }
  return { ok: true, data: data as T };
}

/** Unwrap query result or throw — use in server actions that must fail fast. */
export function unwrapQuery<T>(result: QueryResult<T>, fallbackMessage = "Database query failed"): T {
  if (!result.ok) throw new Error(result.error || fallbackMessage);
  return result.data;
}
