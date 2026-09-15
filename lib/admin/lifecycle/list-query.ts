import type { LifecycleListOptions } from "./types";

type LifecycleFilterQuery = {
  is: (column: string, value: null) => LifecycleFilterQuery;
  not: (column: string, operator: string, value: null) => LifecycleFilterQuery;
};

/** Apply standard lifecycle filters to a Supabase query builder (post-.from()). */
export function applyLifecycleFilters<T extends LifecycleFilterQuery>(
  query: T,
  options?: LifecycleListOptions,
): T {
  let q = query as LifecycleFilterQuery;
  if (!options?.includeDeleted) {
    q = q.is("deleted_at", null);
  }
  if (!options?.showArchived) {
    q = q.is("archived_at", null);
  }
  return q as T;
}

export function rowIsArchived(row: { archived_at?: string | null; archived?: boolean | null }) {
  return Boolean(row.archived_at) || Boolean(row.archived);
}

export function rowIsDeleted(row: { deleted_at?: string | null }) {
  return Boolean(row.deleted_at);
}
