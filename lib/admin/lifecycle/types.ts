export const ADMIN_ENTITY_TYPES = [
  "client",
  "lead",
  "quote",
  "invoice",
  "job",
  "task",
  "expense",
] as const;

export type AdminEntityType = (typeof ADMIN_ENTITY_TYPES)[number];

export type LifecycleAction =
  | "created"
  | "updated"
  | "archived"
  | "unarchived"
  | "deleted"
  | "restored"
  | "duplicated"
  | "status_changed";

export type LifecycleRow = {
  deleted_at?: string | null;
  archived_at?: string | null;
  archived?: boolean | null;
};

export type AdminEntityActivityRow = {
  id: string;
  entity_type: AdminEntityType;
  entity_id: string;
  action: LifecycleAction | string;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
};

export type LifecycleListOptions = {
  showArchived?: boolean;
  includeDeleted?: boolean;
};
