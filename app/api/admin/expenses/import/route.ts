import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { chunkArray, loadJobsForExpenseMatching } from "@/lib/expense-admin";
import { buildDedupeKey, matchJobForRow, parseSpreadsheet } from "@/lib/expense-import";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { text?: string; label?: string; source?: string };
  try {
    body = (await req.json()) as { text?: string; label?: string; source?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const label = (body.label ?? "").trim() || "Spreadsheet import";
  const source = (body.source ?? "paste").trim() || "paste";

  let batch_id: string | null = null;
  try {
    const supabase = createServiceSupabase();
    const parsed = parseSpreadsheet(text);
    const jobs = await loadJobsForExpenseMatching(supabase);

    const rowsForInsert: {
      expense_date: string;
      client_job_text: string | null;
      job_id: string | null;
      service_type: string | null;
      vendor: string | null;
      item_description: string | null;
      category: string | null;
      amount_cents: number;
      payment_method: string | null;
      expense_type: string | null;
      related_job_text: string | null;
      reimbursable: boolean;
      reimbursed: boolean;
      notes: string | null;
      dedupe_key: string;
      import_meta: Record<string, unknown>;
    }[] = [];

    let skipped_invalid = 0;

    for (const r of parsed.rows) {
      if (!r.expense_date || r.amount_cents == null || r.amount_cents < 0) {
        skipped_invalid++;
        continue;
      }

      const dedupe_key = buildDedupeKey({
        expense_date: r.expense_date,
        amount_cents: r.amount_cents,
        vendor: r.vendor,
        item_description: r.item_description,
      });

      const match = matchJobForRow(r, jobs);

      rowsForInsert.push({
        expense_date: r.expense_date,
        client_job_text: r.client_job_text,
        job_id: match.job_id,
        service_type: r.service_type,
        vendor: r.vendor,
        item_description: r.item_description,
        category: r.category,
        amount_cents: r.amount_cents,
        payment_method: r.payment_method,
        expense_type: r.expense_type,
        related_job_text: r.related_job_text,
        reimbursable: r.reimbursable,
        reimbursed: r.reimbursed,
        notes: r.notes,
        dedupe_key,
        import_meta: {
          source_row: r.rowIndex,
          warnings: r.warnings,
          job_match_label: match.label,
        },
      });
    }

    const uniqueKeys = [...new Set(rowsForInsert.map((x) => x.dedupe_key))];
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

    const skipped_db = rowsForInsert.filter((row) => existing.has(row.dedupe_key)).length;
    const freshCandidates = rowsForInsert.filter((row) => !existing.has(row.dedupe_key));
    const seenKeys = new Set<string>();
    const uniqueFresh: typeof rowsForInsert = [];
    for (const row of freshCandidates) {
      if (seenKeys.has(row.dedupe_key)) continue;
      seenKeys.add(row.dedupe_key);
      uniqueFresh.push(row);
    }
    const skipped_batch_dupes = freshCandidates.length - uniqueFresh.length;
    const skipped_duplicates = skipped_db + skipped_batch_dupes;

    const { data: batchRow, error: batchErr } = await supabase
      .from("expense_import_batches")
      .insert({
        label,
        source,
        row_count: parsed.rows.length,
        inserted_count: 0,
        skipped_duplicates: 0,
        skipped_invalid: 0,
      })
      .select("id")
      .single();

    if (batchErr) throw batchErr;
    batch_id = String((batchRow as { id: string }).id);

    let inserted_count = 0;
    if (uniqueFresh.length > 0) {
      const payload = uniqueFresh.map((row) => ({ ...row, batch_id }));
      const { error: insErr } = await supabase.from("expenses").insert(payload);
      if (insErr) throw insErr;
      inserted_count = uniqueFresh.length;
    }

    const { error: updErr } = await supabase
      .from("expense_import_batches")
      .update({
        inserted_count,
        skipped_duplicates,
        skipped_invalid,
      })
      .eq("id", batch_id);

    if (updErr) throw updErr;

    return NextResponse.json({
      batch_id,
      row_count: parsed.rows.length,
      inserted_count,
      skipped_duplicates,
      skipped_invalid,
      unmapped_columns: parsed.unmapped_columns,
    });
  } catch (e) {
    try {
      const supabase = createServiceSupabase();
      if (batch_id) {
        await supabase.from("expenses").delete().eq("batch_id", batch_id);
        await supabase.from("expense_import_batches").delete().eq("id", batch_id);
      }
    } catch {
      /* ignore cleanup errors */
    }
    const msg = e instanceof Error ? e.message : "Import failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
