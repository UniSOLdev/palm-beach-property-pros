import "server-only";

import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Emails a new quote request to the owner via Resend (https://resend.com).
 * Best effort: never throws. Returns true when Resend accepted the message.
 *
 * Vercel env vars:
 *   RESEND_API_KEY    required
 *   QUOTE_TO_EMAIL    required (comma-separate for several inboxes)
 *   QUOTE_FROM_EMAIL  optional (default onboarding@resend.dev — only delivers to
 *                     your Resend account email until you verify your domain)
 */
export type QuoteNotice = {
  leadId?: string | null;
  name: string;
  phone: string;
  email?: string | null;
  service: string;
  address: string;
  city?: string | null;
  propertyType?: string | null;
  message?: string | null;
  contact?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  source?: string | null;
  photoCount?: number;
  savedToLeads: boolean;
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function notifyQuoteByEmail(q: QuoteNotice): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.QUOTE_TO_EMAIL;
  if (!key || !to) return false;

  const rows: [string, string][] = [
    ["Name", q.name],
    ["Phone", q.phone],
    ["Email", q.email || "—"],
    ["Service", q.service],
    ["Property", [q.address, q.city].filter(Boolean).join(", ")],
    ["Property type", q.propertyType || "—"],
    ["Preferred contact", q.contact || "—"],
    ["Best time", [q.preferredDate, q.preferredTime].filter(Boolean).join(" · ") || "—"],
    ["Details", q.message || "—"],
    ["Photos", q.photoCount ? `${q.photoCount} attached (see Admin → Leads)` : "None"],
    ["Source", q.source || "website"],
  ];
  const leadLink =
    q.savedToLeads && q.leadId ? `${SITE_URL}/admin/leads/${q.leadId}` : null;

  const html = `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:16px;color:#1F2933">
<h2 style="margin:0 0 6px">New quote request</h2>
<p style="margin:0 0 16px;color:#555">Call ${esc(q.name)} at <a href="tel:${esc(q.phone.replace(/[^\d+]/g, ""))}">${esc(q.phone)}</a>.</p>
<table style="border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#666;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;font-weight:600">${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("")}</table>
${leadLink ? `<p style="margin-top:18px"><a href="${leadLink}">Open in Admin → Leads</a></p>` : `<p style="margin-top:18px;color:#a33">Note: this request could not be saved to Admin → Leads. Reply from this email.</p>`}
</div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n") + (leadLink ? `\n\n${leadLink}` : "");

  try {
    const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.QUOTE_FROM_EMAIL || `${SITE_NAME} <onboarding@resend.dev>`,
        to: to.split(",").map((s) => s.trim()).filter(Boolean),
        subject: `New quote request — ${q.name} · ${q.service}`,
        html,
        text,
        ...(q.email ? { reply_to: q.email } : {}),
      }),
    });
    if (!res.ok) {
      console.error("[PBPP Quote] Resend error", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[PBPP Quote] Resend request failed", error);
    return false;
  }
}
