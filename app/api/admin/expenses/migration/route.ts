import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveMigrationRun,
  processMigrationBatch,
  startMigrationRun,
} from "@/lib/receipt/migration/run";

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

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const active = await getActiveMigrationRun();
  return NextResponse.json({ active });
}

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    run_id?: string;
  };

  if (body.action === "start") {
    const started = await startMigrationRun(user.id);
    return NextResponse.json(started);
  }

  if (body.action === "batch" && body.run_id) {
    const result = await processMigrationBatch(body.run_id);
    const active = await getActiveMigrationRun();
    return NextResponse.json({ ...result, active });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
