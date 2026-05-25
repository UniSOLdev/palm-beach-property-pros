import { discoverMigrationCandidates } from "@/lib/receipt/migration/discover";
import { processMigrationCandidate } from "@/lib/receipt/migration/processor";
import { createServiceClient } from "@/lib/supabase/service";

export const MIGRATION_BATCH_SIZE = 3;

export type MigrationRunStatus = {
  run_id: string;
  status: string;
  paused: boolean;
  total_count: number;
  completed_count: number;
  failed_count: number;
  skipped_count: number;
  processing_count: number;
  queued_count: number;
};

async function logMigration(
  runId: string,
  message: string,
  level: "info" | "warn" | "error" = "info",
  itemId?: string,
  details?: Record<string, unknown>,
) {
  const supabase = createServiceClient();
  await supabase.from("receipt_migration_logs").insert({
    run_id: runId,
    item_id: itemId ?? null,
    level,
    message,
    details: details ?? null,
  });
}

export async function getActiveMigrationRun(): Promise<MigrationRunStatus | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("receipt_migration_runs")
    .select("*")
    .in("status", ["running", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const { count: queued } = await supabase
    .from("receipt_migration_items")
    .select("id", { count: "exact", head: true })
    .eq("run_id", data.id)
    .eq("status", "queued");

  return {
    run_id: data.id,
    status: data.status,
    paused: data.paused,
    total_count: data.total_count,
    completed_count: data.completed_count,
    failed_count: data.failed_count,
    skipped_count: data.skipped_count,
    processing_count: data.processing_count,
    queued_count: queued ?? 0,
  };
}

export async function startMigrationRun(userId: string | null): Promise<{ run_id: string; total: number }> {
  const supabase = createServiceClient();
  const active = await getActiveMigrationRun();
  if (active && active.status === "running") {
    return { run_id: active.run_id, total: active.total_count };
  }

  const candidates = await discoverMigrationCandidates();

  const { data: run, error: runErr } = await supabase
    .from("receipt_migration_runs")
    .insert({
      created_by: userId,
      status: "running",
      paused: false,
      total_count: candidates.length,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (runErr || !run) throw new Error(runErr?.message ?? "Could not start migration run");

  if (candidates.length) {
    const items = candidates.map((c) => ({
      run_id: run.id,
      source_bucket: c.source_bucket,
      source_path: c.source_path,
      expense_id: c.expense_id,
      expense_receipt_id: c.expense_receipt_id,
      status: "queued" as const,
    }));
    const { error: itemsErr } = await supabase.from("receipt_migration_items").insert(items);
    if (itemsErr) throw new Error(itemsErr.message);
  }

  await logMigration(run.id, `Migration queued ${candidates.length} receipts.`, "info");
  return { run_id: run.id, total: candidates.length };
}

export async function setMigrationPaused(runId: string, paused: boolean): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("receipt_migration_runs")
    .update({
      paused,
      status: paused ? "paused" : "running",
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId);
  await logMigration(runId, paused ? "Migration paused." : "Migration resumed.");
}

export async function processMigrationBatch(runId: string): Promise<{ processed: number; done: boolean }> {
  const supabase = createServiceClient();

  const { data: run } = await supabase
    .from("receipt_migration_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (!run || run.paused || run.status === "completed") {
    return { processed: 0, done: true };
  }

  const { data: items } = await supabase
    .from("receipt_migration_items")
    .select("*")
    .eq("run_id", runId)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(MIGRATION_BATCH_SIZE);

  if (!items?.length) {
    await supabase
      .from("receipt_migration_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        processing_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);
    await logMigration(runId, "Migration completed — no items left in queue.");
    return { processed: 0, done: true };
  }

  let processed = 0;

  for (const item of items) {
    await supabase
      .from("receipt_migration_items")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", item.id);

    await supabase
      .from("receipt_migration_runs")
      .update({
        processing_count: (run.processing_count ?? 0) + 1,
        last_batch_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);

    const result = await processMigrationCandidate({
      source_bucket: item.source_bucket,
      source_path: item.source_path,
      expense_id: item.expense_id,
      expense_receipt_id: item.expense_receipt_id,
    });

    const itemStatus = result.skipped ? "skipped" : result.ok ? "completed" : "failed";

    await supabase
      .from("receipt_migration_items")
      .update({
        status: itemStatus,
        target_original_path: result.target_original_path ?? null,
        target_optimized_path: result.target_optimized_path ?? null,
        target_thumbnail_path: result.target_thumbnail_path ?? null,
        error_message: result.error ?? null,
        log_message: result.log ?? null,
        attempts: (item.attempts ?? 0) + 1,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    const { data: freshRun } = await supabase
      .from("receipt_migration_runs")
      .select("completed_count, failed_count, skipped_count, processing_count")
      .eq("id", runId)
      .single();

    const counts = freshRun ?? run;
    await supabase
      .from("receipt_migration_runs")
      .update({
        completed_count:
          (counts.completed_count ?? 0) + (itemStatus === "completed" ? 1 : 0),
        failed_count: (counts.failed_count ?? 0) + (itemStatus === "failed" ? 1 : 0),
        skipped_count: (counts.skipped_count ?? 0) + (itemStatus === "skipped" ? 1 : 0),
        processing_count: Math.max(0, (counts.processing_count ?? 1) - 1),
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);

    await logMigration(
      runId,
      result.skipped
        ? `Skipped ${item.source_path}`
        : result.ok
          ? `Upgraded ${item.source_path}`
          : `Failed ${item.source_path}: ${result.error}`,
      result.ok ? "info" : "error",
      item.id,
    );

    processed += 1;
  }

  return { processed, done: false };
}

export async function retryFailedMigrationItems(runId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("receipt_migration_items")
    .update({ status: "queued", error_message: null, updated_at: new Date().toISOString() })
    .eq("run_id", runId)
    .eq("status", "failed")
    .select("id");

  if (error) throw new Error(error.message);

  const count = data?.length ?? 0;
  if (count) {
    await supabase
      .from("receipt_migration_runs")
      .update({
        status: "running",
        paused: false,
        failed_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);
    await logMigration(runId, `Re-queued ${count} failed items.`);
  }
  return count;
}

export async function listMigrationLogs(runId: string, limit = 40) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("receipt_migration_logs")
    .select("id, level, message, created_at")
    .eq("run_id", runId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
