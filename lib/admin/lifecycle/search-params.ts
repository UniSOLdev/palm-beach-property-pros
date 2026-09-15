import type { LifecycleListOptions } from "./types";

export function lifecycleOptionsFromSearchParams(
  searchParams?: { archived?: string } | null,
): LifecycleListOptions {
  return {
    showArchived: searchParams?.archived === "1",
  };
}
