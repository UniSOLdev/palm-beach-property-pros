import "server-only";

import { z } from "zod";
import { AREA_OPTIONS, BEST_TIMES, SERVICE_OPTIONS } from "@/lib/site/quote-options";
import { createServerAnonClient } from "@/lib/supabase/service";
import { SITE_NAME } from "@/lib/site";

/**
 * Private quote request → (1) email to Clayton via Resend, (2) lead row in
 * Supabase `quote_requests` (the admin Leads board). Either one succeeding
 * counts as delivered; both are attempted.
 *
 * Vercel env vars:
 *   RESEND_API_KEY      required for email   (resend.com → API Keys)
 *   QUOTE_TO_EMAIL      required for email   (where requests are sent)
 *   QUOTE_FROM_EMAIL    optional             (default: onboarding@resend.dev, which
 *                                             only delivers to your Resend account
 *                                             email until you verify your domain)
 *   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (already set) → admin Leads
 */

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Please enter a phone number we can reach you at."),
  email: z.union([z.literal(""), z.string().trim().email("Please check your email address.").max(200)]),
  area: z.enum(AREA_OPTIONS, { message: "Please choose your property's area." }),
  services: z.array(z.enum(SERVICE_OPTIONS)).min(1, "Please choose at least one service.").max(10),
  residence: z.string().trim().max(200).optional().default(""),
  bestTime: z.enum(BEST_TIMES, { message: "Please choose a time to call." }),
  notes: z.string().trim().max(2000).optional().default(""),
  // spam controls
  company: z.string().max(0).optional().default(""), // honeypot: must be empty
  startedAt: z.number().optional(),
  source: z.string().trim().max(200).optional().default("website"),
});

export type Inquiry = z.infer<typeof inquirySchema>;

export type InquiryResult =
  | { ok: true; delivered: { email: boolean; lead: boolean } }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string> };

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function summaryLines(q: Inquiry): [string, string][] {
  return [
    ["Name", q.name],
    ["Phone", q.phone],
    ["Email", q.email || "—"],
    ["Property area", q.area],
    ["Services", q.services.join(", ")],
    ["In residence", q.residence || "—"],
    ["Best time to call", q.bestTime],
    ["Notes", q.notes || "—"],
    ["Source", q.source],
  ];
}

async function sendEmail(q: Inquiry): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.QUOTE_TO_EMAIL;
  if (!key || !to) {
    console.warn("[quote] email skipped: RESEND_API_KEY or QUOTE_TO_EMAIL not set");
    return false;
  }
  const from = process.env.QUOTE_FROM_EMAIL || `${SITE_NAME} <onboarding@resend.dev>`;
  const api = process.env.RESEND_API_URL || "https://api.resend.com/emails";
  const rows = summaryLines(q)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;font-weight:600">${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");
  const html = `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:16px;color:#1F2933">
<h2 style="margin:0 0 4px">New private quote request</h2>
<p style="margin:0 0 16px;color:#555">Call ${esc(q.name.split(" ")[0])} at <a href="tel:${esc(q.phone.replace(/[^\d+]/g, ""))}">${esc(q.phone)}</a> — best time: ${esc(q.bestTime)}.</p>
<table style="border-collapse:collapse">${rows}</table></div>`;
  const text = summaryLines(q)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  try {
    const res = await fetch(api, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: to.split(",").map((s) => s.trim()).filter(Boolean),
        subject: `Quote request: ${q.name} — ${q.area}`,
        html,
        text,
        ...(q.email ? { reply_to: q.email } : {}),
      }),
    });
    if (!res.ok) {
      console.error("[quote] Resend error", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[quote] Resend request failed", err);
    return false;
  }
}

async function saveLead(q: Inquiry): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
    console.warn("[quote] lead save skipped: Supabase env not set");
    return false;
  }
  try {
    const supabase = createServerAnonClient();
    const message = [
      q.residence ? `In residence: ${q.residence}` : "",
      `Best time to call: ${q.bestTime}`,
      q.notes ? `Notes: ${q.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const { error } = await supabase.rpc("submit_public_quote_request", {
      p_name: q.name,
      p_phone: q.phone,
      p_email: q.email || null,
      p_service_requested: q.services.join(", "),
      p_address: q.area, // area only — we never collect street addresses on the public site
      p_city: q.area,
      p_property_type: "Residence",
      p_message: message || null,
      p_preferred_contact: "Call",
      p_preferred_date: null,
      p_preferred_time: q.bestTime,
      p_source: q.source || "website",
      p_referrer: null,
    });
    if (error) {
      console.error("[quote] lead RPC failed", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[quote] lead save threw", err);
    return false;
  }
}

export async function handleInquiry(input: unknown): Promise<InquiryResult> {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    // Honeypot tripped: pretend success so bots learn nothing.
    if (fieldErrors.company) return { ok: true, delivered: { email: false, lead: false } };
    return { ok: false, status: 400, error: "Please check the highlighted fields.", fieldErrors };
  }
  const q = parsed.data;
  if (q.startedAt && Date.now() - q.startedAt < 2500) {
    return { ok: true, delivered: { email: false, lead: false } }; // filled in by a bot
  }

  const [email, lead] = await Promise.all([sendEmail(q), saveLead(q)]);
  if (!email && !lead) {
    return {
      ok: false,
      status: 503,
      error: "We couldn't send your request just now. Please call us — we'd be glad to help.",
    };
  }
  return { ok: true, delivered: { email, lead } };
}
