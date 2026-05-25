import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logPipelineError } from "@/lib/pipeline/logger";
import { ReceiptScanError, toUserScanMessage } from "@/lib/receipt/errors";
import { scanReceiptFromFile } from "@/lib/receipt/scan-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: "Sign in to scan receipts." }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Choose a receipt photo to upload." },
        { status: 400 },
      );
    }

    const pathPrefix = String(form.get("pathPrefix") ?? "expenses").replace(/[^a-zA-Z0-9/_-]/g, "") || "expenses";
    const defaultJobId = String(form.get("jobId") ?? "").trim();
    const prefix = defaultJobId ? `jobs/${defaultJobId}` : pathPrefix;

    const result = await scanReceiptFromFile(file, {
      pathPrefix: prefix,
      userId: user.id,
    });

    return NextResponse.json(result);
  } catch (err) {
    logPipelineError("receipt scan API error", err, { step: "POST /api/admin/expenses/scan" });
    const status = err instanceof ReceiptScanError ? err.status : 500;
    return NextResponse.json(
      {
        success: false,
        confidence: 0,
        vendor: "",
        date: new Date().toISOString().slice(0, 10),
        total: 0,
        subtotal: 0,
        tax: 0,
        payment_method: "Card",
        suggested_category: "Misc",
        suggested_job_id: "",
        notes: "",
        line_items: [],
        warnings: [toUserScanMessage(err)],
        error: toUserScanMessage(err),
      },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
