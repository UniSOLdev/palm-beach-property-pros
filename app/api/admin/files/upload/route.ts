import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { logOperationalActivity } from "@/lib/ops/activity";
import { createServiceSupabase } from "@/lib/supabase/service";

const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const jobId = String(form.get("job_id") ?? "").trim();
  const fileType = String(form.get("file_type") ?? "photo").trim() || "photo";
  const caption = String(form.get("caption") ?? "").trim() || null;

  if (!jobId) return NextResponse.json({ error: "job_id is required" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `jobs/${jobId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  try {
    const supabase = createServiceSupabase();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await supabase.storage.from("ops-files").upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (upErr) throw upErr;

    const { data: row, error: dbErr } = await supabase
      .from("job_files")
      .insert({
        job_id: jobId,
        file_type: fileType,
        storage_path: path,
        mime_type: file.type || null,
        file_name: file.name,
        caption,
        uploaded_by: "admin",
      })
      .select("id, job_id, file_type, storage_path, file_name, caption, created_at")
      .single();

    if (dbErr) throw dbErr;

    const { data: signed } = await supabase.storage.from("ops-files").createSignedUrl(path, 3600);
    const { data: job } = await supabase.from("jobs").select("client_id").eq("id", jobId).maybeSingle();
    await logOperationalActivity(supabase, {
      event_type: fileType === "photo" ? "photo.uploaded" : "file.uploaded",
      title: fileType === "photo" ? "Photo uploaded" : "File uploaded",
      body: file.name,
      job_id: jobId,
      client_id: job?.client_id ? String(job.client_id) : null,
      href: `/admin/jobs/${jobId}`,
      metadata: { file_id: row.id, file_type: fileType, storage_path: path },
    });

    return NextResponse.json({ file: row, signed_url: signed?.signedUrl ?? null });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
