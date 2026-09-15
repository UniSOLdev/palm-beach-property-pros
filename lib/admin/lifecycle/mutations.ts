import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ENTITY_ADMIN_PATH, ENTITY_TABLE } from "./constants";
import { logEntityActivity } from "./activity";
import type { AdminEntityType } from "./types";

async function requireAdminUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Admin authentication required.");
  return user;
}

function tableFor(type: AdminEntityType) {
  return ENTITY_TABLE[type];
}

function revalidateEntity(type: AdminEntityType, id?: string) {
  revalidatePath(ENTITY_ADMIN_PATH[type]);
  revalidatePath("/admin");
  if (id) {
    const detail = {
      lead: `/admin/leads/${id}`,
      quote: `/admin/quotes/${id}`,
      invoice: `/admin/invoices/${id}`,
      job: `/admin/jobs/${id}`,
    } as Partial<Record<AdminEntityType, string>>;
    const path = detail[type];
    if (path) revalidatePath(path);
  }
}

export async function archiveEntity(
  supabase: SupabaseClient,
  entityType: AdminEntityType,
  entityId: string,
  summary?: string,
) {
  const user = await requireAdminUser(supabase);
  const now = new Date().toISOString();
  const table = tableFor(entityType);

  const { error } = await supabase
    .from(table)
    .update({
      archived_at: now,
      archived_by: user.id,
      archived: true,
    })
    .eq("id", entityId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  await logEntityActivity(supabase, {
    entityType,
    entityId,
    action: "archived",
    summary: summary ?? "Archived",
    userId: user.id,
  });

  revalidateEntity(entityType, entityId);
}

export async function unarchiveEntity(
  supabase: SupabaseClient,
  entityType: AdminEntityType,
  entityId: string,
) {
  const user = await requireAdminUser(supabase);
  const table = tableFor(entityType);

  const { error } = await supabase
    .from(table)
    .update({
      archived_at: null,
      archived_by: null,
      archived: false,
    })
    .eq("id", entityId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  await logEntityActivity(supabase, {
    entityType,
    entityId,
    action: "unarchived",
    summary: "Restored from archive",
    userId: user.id,
  });

  revalidateEntity(entityType, entityId);
}

export async function softDeleteEntity(
  supabase: SupabaseClient,
  entityType: AdminEntityType,
  entityId: string,
  summary?: string,
) {
  const user = await requireAdminUser(supabase);
  const now = new Date().toISOString();
  const table = tableFor(entityType);

  const patch: Record<string, unknown> = {
    deleted_at: now,
    deleted_by: user.id,
  };

  if (entityType === "invoice") {
    patch.document_status = "void";
  }

  const { error } = await supabase.from(table).update(patch).eq("id", entityId).is("deleted_at", null);

  if (error) throw new Error(error.message);

  await logEntityActivity(supabase, {
    entityType,
    entityId,
    action: "deleted",
    summary: summary ?? "Moved to trash (soft delete)",
    userId: user.id,
  });

  revalidateEntity(entityType, entityId);
}

export async function restoreDeletedEntity(
  supabase: SupabaseClient,
  entityType: AdminEntityType,
  entityId: string,
) {
  const user = await requireAdminUser(supabase);
  const table = tableFor(entityType);

  const patch: Record<string, unknown> = {
    deleted_at: null,
    deleted_by: null,
  };

  if (entityType === "invoice") {
    patch.document_status = "draft";
  }

  const { error } = await supabase.from(table).update(patch).eq("id", entityId).not("deleted_at", "is", null);

  if (error) throw new Error(error.message);

  await logEntityActivity(supabase, {
    entityType,
    entityId,
    action: "restored",
    summary: "Restored from trash",
    userId: user.id,
  });

  revalidateEntity(entityType, entityId);
}
