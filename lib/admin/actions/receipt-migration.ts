"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveMigrationRun,
  listMigrationLogs,
  processMigrationBatch,
  retryFailedMigrationItems,
  setMigrationPaused,
  startMigrationRun,
} from "@/lib/receipt/migration/run";
import { discoverMigrationCandidates } from "@/lib/receipt/migration/discover";

export async function getReceiptMigrationDashboardAction() {
  const pending = (await discoverMigrationCandidates()).length;
  const active = await getActiveMigrationRun();
  const logs = active ? await listMigrationLogs(active.run_id, 30) : [];

  return {
    pending_upgrade_count: pending,
    active,
    logs,
  };
}

export async function startReceiptMigrationAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const result = await startMigrationRun(user?.id ?? null);
  revalidatePath("/admin/expenses/migration");
  return result;
}

export async function runReceiptMigrationBatchAction(runId: string) {
  const result = await processMigrationBatch(runId);
  revalidatePath("/admin/expenses/migration");
  return result;
}

export async function pauseReceiptMigrationAction(runId: string, paused: boolean) {
  await setMigrationPaused(runId, paused);
  revalidatePath("/admin/expenses/migration");
}

export async function retryFailedReceiptMigrationAction(runId: string) {
  const count = await retryFailedMigrationItems(runId);
  revalidatePath("/admin/expenses/migration");
  return { requeued: count };
}
