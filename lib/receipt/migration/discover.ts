import { LEGACY_RECEIPT_BUCKETS, RECEIPT_BUCKETS } from "@/lib/receipt/buckets";
import {
  isReceiptFullyProcessed,
  type ReceiptProcessingStatus,
} from "@/lib/receipt/processing-status";
import { createServiceClient } from "@/lib/supabase/service";

export type MigrationCandidate = {
  source_bucket: string;
  source_path: string;
  expense_id: string | null;
  expense_receipt_id: string | null;
};

const LIST_LIMIT = 200;

function isOriginalAssetPath(path: string): boolean {
  if (path.includes("-thumb")) return false;
  if (path.includes("-ocr")) return false;
  return path.includes("-original.") || /\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(path);
}

async function listObjectsAt(bucket: string, prefix: string): Promise<string[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: LIST_LIMIT,
    sortBy: { column: "name", order: "asc" },
  });
  if (error || !data) return [];

  const paths: string[] = [];
  for (const item of data) {
    if (!item.name) continue;
    const full = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id == null && !item.metadata) {
      const nested = await listObjectsAt(bucket, full);
      paths.push(...nested);
      continue;
    }
    paths.push(full);
  }
  return paths;
}

/** Collect receipts needing normalization from DB + legacy storage. */
export async function discoverMigrationCandidates(): Promise<MigrationCandidate[]> {
  const supabase = createServiceClient();
  const seen = new Set<string>();
  const out: MigrationCandidate[] = [];

  const push = (c: MigrationCandidate) => {
    const key = `${c.source_bucket}:${c.source_path}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(c);
  };

  const { data: expenses } = await supabase
    .from("expenses")
    .select(
      "id, receipt_storage_path, receipt_original_path, receipt_optimized_path, receipt_thumbnail_path, receipt_processing_status",
    )
    .or("receipt_storage_path.not.is.null,receipt_url.not.is.null");

  for (const row of expenses ?? []) {
    const path = row.receipt_original_path ?? row.receipt_storage_path;
    if (!path) continue;
    if (
      isReceiptFullyProcessed({
        receipt_processing_status: row.receipt_processing_status as ReceiptProcessingStatus | null,
        receipt_optimized_path: row.receipt_optimized_path,
        receipt_thumbnail_path: row.receipt_thumbnail_path,
      })
    ) {
      continue;
    }
    push({
      source_bucket: path.startsWith("expenses/pending/")
        ? RECEIPT_BUCKETS.original
        : LEGACY_RECEIPT_BUCKETS.original,
      source_path: path,
      expense_id: row.id,
      expense_receipt_id: null,
    });
  }

  const { data: receipts } = await supabase
    .from("expense_receipts")
    .select(
      "id, expense_id, receipt_storage_path, receipt_original_path, receipt_optimized_path, receipt_thumbnail_path, receipt_processing_status, optimized_storage_path",
    );

  for (const row of receipts ?? []) {
    const path = row.receipt_original_path ?? row.receipt_storage_path;
    if (!path) continue;
    if (
      isReceiptFullyProcessed({
        receipt_processing_status: row.receipt_processing_status as ReceiptProcessingStatus | null,
        receipt_optimized_path: row.receipt_optimized_path ?? row.optimized_storage_path,
        receipt_thumbnail_path: row.receipt_thumbnail_path,
      })
    ) {
      continue;
    }
    push({
      source_bucket: LEGACY_RECEIPT_BUCKETS.original,
      source_path: path,
      expense_id: row.expense_id,
      expense_receipt_id: row.id,
    });
  }

  for (const bucket of [LEGACY_RECEIPT_BUCKETS.original] as const) {
    for (const prefix of ["expenses", "jobs", ""]) {
      const paths = await listObjectsAt(bucket, prefix);
      for (const path of paths) {
        if (!isOriginalAssetPath(path)) continue;
        push({
          source_bucket: bucket,
          source_path: path,
          expense_id: null,
          expense_receipt_id: null,
        });
      }
    }
  }

  return out;
}
