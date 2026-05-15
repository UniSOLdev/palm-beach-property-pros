import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { chunkArray, loadJobsForExpenseMatching } from "@/lib/expense-admin";
import {
  buildDedupeKey,
  parseSpreadsheet,
  toPreviewRow,
  vendorAmountSignature,
  type ExpensePreviewRow,
} from "@/lib/expense-import";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { text?: string };
  try {
    body = (await req.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabase();
    const parsed = parseSpreadsheet(text);
    const jobs = await loadJobsForExpenseMatching(supabase);

    const dedupeKeys = parsed.rows.map((r) =>
      buildDedupeKey({
        expense_date: r.expense_date,
        amount_cents: r.amount_cents,
        vendor: r.vendor,
        item_description: r.item_description,
      }),
    );
    const uniqueKeys = [...new Set(dedupeKeys)];
    const existing = new Set<string>();
    for (const part of chunkArray(uniqueKeys, 200)) {
      if (part.length === 0) continue;
      const { data, error } = await supabase.from("expenses").select("dedupe_key").in("dedupe_key", part);
      if (error) throw error;
      for (const row of data ?? []) {
        const k = (row as { dedupe_key?: string }).dedupe_key;
        if (k) existing.add(k);
      }
    }

    const batchKeyCounts = new Map<string, number>();
    for (const k of dedupeKeys) {
      batchKeyCounts.set(k, (batchKeyCounts.get(k) ?? 0) + 1);
    }

    const vendorAmtCounts = new Map<string, number>();
    for (const r of parsed.rows) {
      const sig = vendorAmountSignature(r.vendor, r.amount_cents);
      vendorAmtCounts.set(sig, (vendorAmtCounts.get(sig) ?? 0) + 1);
    }

    const previews: ExpensePreviewRow[] = parsed.rows.map((r) => {
      const dedupe_key = buildDedupeKey({
        expense_date: r.expense_date,
        amount_cents: r.amount_cents,
        vendor: r.vendor,
        item_description: r.item_description,
      });
      const duplicateInBatch = (batchKeyCounts.get(dedupe_key) ?? 0) > 1;
      const recurringHint = (vendorAmtCounts.get(vendorAmountSignature(r.vendor, r.amount_cents)) ?? 0) >= 3;
      return toPreviewRow(r, jobs, {
        duplicateInDb: existing.has(dedupe_key),
        duplicateInBatch,
        recurringHint,
      });
    });

    const keyToRows = new Map<string, number[]>();
    for (const r of previews) {
      if (!keyToRows.has(r.dedupe_key)) keyToRows.set(r.dedupe_key, []);
      keyToRows.get(r.dedupe_key)!.push(r.rowIndex);
    }
    const duplicate_merge_suggestions = [...keyToRows.entries()]
      .filter(([, idxs]) => idxs.length > 1)
      .map(([dedupe_key, row_indexes]) => ({
        dedupe_key,
        row_indexes,
        count: row_indexes.length,
      }));

    const invalid_rows = previews.filter((p) => !p.valid).length;
    const duplicate_db_rows = previews.filter((p) => p.duplicate_in_db).length;
    const duplicate_batch_rows = previews.filter((p) => p.duplicate_in_batch).length;
    const recurring_rows = previews.filter((p) => p.recurring_hint).length;

    return NextResponse.json({
      row_count: previews.length,
      delimiter: parsed.delimiter,
      headers: parsed.headers,
      unmapped_columns: parsed.unmapped_columns,
      previews,
      duplicate_merge_suggestions,
      summary: {
        invalid_rows,
        duplicate_db_rows,
        duplicate_batch_rows,
        recurring_rows,
      },
      future: {
        google_sheets_sync: "planned",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Preview failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
