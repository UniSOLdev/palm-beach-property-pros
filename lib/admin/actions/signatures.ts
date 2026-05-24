"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { signingPublicUrl } from "@/lib/admin/signing-utils";
import type { SigningDocumentType, SigningRequestRow } from "@/lib/admin/types-signatures";

function newToken() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export async function createSigningRequest(input: {
  document_type: SigningDocumentType;
  document_public_id: string;
  document_id?: string | null;
  title: string;
  expires_in_days?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const token = newToken();
  const expiresAt = input.expires_in_days
    ? new Date(Date.now() + input.expires_in_days * 86400000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("signing_requests")
    .insert({
      token,
      document_type: input.document_type,
      document_public_id: input.document_public_id,
      document_id: input.document_id ?? null,
      title: input.title,
      status: "pending",
      expires_at: expiresAt,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return { request: data as SigningRequestRow, url: signingPublicUrl(token) };
}

export async function getSigningRequestByToken(token: string): Promise<SigningRequestRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("signing_requests")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) return null;
  return data as SigningRequestRow | null;
}

export async function submitDocumentSignature(input: {
  token: string;
  signer_name: string;
  signature_type: "typed" | "drawn";
  signature_data: string;
}) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent") ?? null;

  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("signing_requests")
    .select("*")
    .eq("token", input.token)
    .maybeSingle();

  if (!existing || existing.status !== "pending") {
    throw new Error("This signing link is invalid or already completed.");
  }
  if (existing.expires_at && new Date(existing.expires_at) < new Date()) {
    throw new Error("This signing link has expired.");
  }

  const audit_json = {
    signed_at: new Date().toISOString(),
    ip,
    user_agent: userAgent,
    document_type: existing.document_type,
    document_public_id: existing.document_public_id,
  };

  const { error } = await admin
    .from("signing_requests")
    .update({
      status: "signed",
      signer_name: input.signer_name.trim(),
      signature_type: input.signature_type,
      signature_data: input.signature_data,
      signer_ip: ip,
      signer_user_agent: userAgent,
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      audit_json,
    })
    .eq("token", input.token)
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  if (existing.document_type === "change_order") {
    await admin
      .from("change_orders")
      .update({
        status: "approved",
        approval_signature_name: input.signer_name.trim(),
        approval_signature_text: input.signature_type === "typed" ? input.signature_data : "[drawn signature]",
        approval_ip: ip,
        approval_user_agent: userAgent,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("public_id", existing.document_public_id)
      .eq("status", "sent");
  }

  revalidatePath(`/sign/${input.token}`);
}

export async function listSigningRequestsForDocument(
  document_type: SigningDocumentType,
  document_public_id: string,
): Promise<SigningRequestRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("signing_requests")
    .select("*")
    .eq("document_type", document_type)
    .eq("document_public_id", document_public_id)
    .order("created_at", { ascending: false });
  return (data ?? []) as SigningRequestRow[];
}
