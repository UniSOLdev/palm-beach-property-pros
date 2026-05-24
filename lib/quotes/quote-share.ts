import { SITE_NAME, SITE_URL } from "@/lib/site";

export function quotePublicUrl(publicId: string) {
  return `${SITE_URL}/view/quote/${publicId}`;
}

export function buildQuoteSmsBody(name: string, quoteLink: string) {
  const firstName = name.trim().split(/\s+/)[0] || "there";
  return `Hey ${firstName} — your estimate is ready for review.

View and approve here:
${quoteLink}

Once signed, we'll get everything scheduled.

– ${SITE_NAME}`;
}

export function buildQuoteSmsHref(phone: string, body: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `sms:${digits}?body=${encodeURIComponent(body)}`;
}

export function buildQuoteEmailSubject(quoteNumber: string) {
  return `Your estimate from ${SITE_NAME} — ${quoteNumber}`;
}

export function buildQuoteEmailHtml(options: {
  clientName: string;
  quoteNumber: string;
  serviceType: string;
  quoteLink: string;
  totalFormatted?: string;
}) {
  const { clientName, quoteNumber, serviceType, quoteLink, totalFormatted } = options;
  const firstName = clientName.trim().split(/\s+/)[0] || "there";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,42,68,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0f2a44,#1a5f7a);padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#a8d4e6;">${SITE_NAME}</p>
            <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#faf8f4;">Your estimate is ready</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:#2c2c2c;line-height:1.6;">
            <p style="margin:0 0 16px;font-size:16px;">Hi ${firstName},</p>
            <p style="margin:0 0 16px;font-size:15px;">Your estimate for <strong>${serviceType}</strong> (${quoteNumber}) is ready for review.${totalFormatted ? ` Estimated total: <strong>${totalFormatted}</strong>.` : ""}</p>
            <p style="margin:0 0 24px;font-size:15px;">Review the scope, terms, and approve electronically — it only takes a minute.</p>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
              <tr>
                <td style="border-radius:12px;background:#0f2a44;">
                  <a href="${quoteLink}" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:600;color:#faf8f4;text-decoration:none;">View &amp; approve estimate</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#666;">Once signed, we'll coordinate scheduling and next steps.</p>
            <p style="margin:24px 0 0;font-size:13px;color:#888;">— ${SITE_NAME}<br><a href="${SITE_URL}" style="color:#1a5f7a;">${SITE_URL.replace(/^https?:\/\//, "")}</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildQuoteMailtoHref(email: string, subject: string, html: string) {
  if (!email.trim()) return null;
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plain.slice(0, 1800))}`;
}
