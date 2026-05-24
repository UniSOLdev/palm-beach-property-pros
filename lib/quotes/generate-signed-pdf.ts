import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { SITE_NAME } from "@/lib/site";
import type { PublicQuote, PublicQuoteItem } from "@/lib/quotes/types";

type GenerateSignedPdfInput = {
  quote: PublicQuote;
  items: PublicQuoteItem[];
  signaturePngBytes: Uint8Array;
  signedName: string;
  signedAt: Date;
};

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function generateSignedQuotePdf(input: GenerateSignedPdfInput): Promise<Uint8Array> {
  const { quote, items, signaturePngBytes, signedName, signedAt } = input;
  const client = quote.clients;
  const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.06, 0.16, 0.27);
  const charcoal = rgb(0.17, 0.17, 0.17);
  const muted = rgb(0.45, 0.45, 0.45);

  let y = 740;

  page.drawText(SITE_NAME, { x: 48, y, size: 10, font: fontBold, color: rgb(0.1, 0.37, 0.48) });
  y -= 22;
  page.drawText("Signed Estimate", { x: 48, y, size: 22, font: fontBold, color: navy });
  y -= 18;
  page.drawText(quote.quote_number, { x: 48, y, size: 11, font, color: muted });
  y -= 28;

  const infoLines = [
    client?.name ? `Client: ${client.name}` : null,
    `Service: ${quote.service_type}`,
    `Property: ${quote.job_address}`,
    quote.expiration_date ? `Valid through: ${formatDate(quote.expiration_date)}` : null,
  ].filter(Boolean) as string[];

  for (const line of infoLines) {
    page.drawText(line, { x: 48, y, size: 10, font, color: charcoal });
    y -= 14;
  }

  y -= 10;
  page.drawLine({ start: { x: 48, y }, end: { x: 564, y }, thickness: 1, color: rgb(0.88, 0.88, 0.88) });
  y -= 22;

  page.drawText("Line items", { x: 48, y, size: 11, font: fontBold, color: navy });
  y -= 18;

  if (items.length) {
    for (const item of items) {
      const amount = formatCurrency(Number(item.quantity) * Number(item.unit_price));
      const descLines = wrapText(item.description, 52);
      for (let i = 0; i < descLines.length; i++) {
        page.drawText(descLines[i]!, { x: 48, y, size: 10, font, color: charcoal });
        if (i === 0) {
          page.drawText(amount, { x: 480, y, size: 10, font: fontBold, color: navy });
        }
        y -= 14;
      }
      y -= 4;
      if (y < 120) break;
    }
  } else {
    page.drawText("Pricing per agreed scope — see notes.", { x: 48, y, size: 10, font, color: muted });
    y -= 16;
  }

  y -= 6;
  page.drawLine({ start: { x: 48, y }, end: { x: 564, y }, thickness: 1, color: rgb(0.88, 0.88, 0.88) });
  y -= 20;
  page.drawText("Total", { x: 48, y, size: 12, font: fontBold, color: navy });
  page.drawText(formatCurrency(subtotal), { x: 480, y, size: 12, font: fontBold, color: navy });
  y -= 28;

  if (quote.notes) {
    page.drawText("Notes", { x: 48, y, size: 10, font: fontBold, color: navy });
    y -= 14;
    for (const line of wrapText(quote.notes, 90).slice(0, 6)) {
      page.drawText(line, { x: 48, y, size: 9, font, color: charcoal });
      y -= 12;
    }
    y -= 8;
  }

  if (quote.terms) {
    page.drawText("Terms", { x: 48, y, size: 10, font: fontBold, color: navy });
    y -= 14;
    for (const line of wrapText(quote.terms, 90).slice(0, 8)) {
      page.drawText(line, { x: 48, y, size: 8, font, color: muted });
      y -= 11;
    }
    y -= 8;
  }

  y = Math.min(y, 200);
  page.drawLine({ start: { x: 48, y: y + 8 }, end: { x: 564, y: y + 8 }, thickness: 1, color: rgb(0.88, 0.88, 0.88) });
  page.drawText("Electronic signature", { x: 48, y, size: 10, font: fontBold, color: navy });
  y -= 16;

  try {
    const sigImage = await pdf.embedPng(signaturePngBytes);
    const sigDims = sigImage.scale(0.35);
    page.drawImage(sigImage, { x: 48, y: y - sigDims.height, width: sigDims.width, height: sigDims.height });
    y -= sigDims.height + 12;
  } catch {
    page.drawText("[Signature on file]", { x: 48, y, size: 10, font, color: charcoal });
    y -= 16;
  }

  page.drawText(`Signed by: ${signedName}`, { x: 48, y, size: 10, font: fontBold, color: charcoal });
  y -= 14;
  page.drawText(`Signed at: ${signedAt.toLocaleString("en-US", { timeZone: "America/New_York" })} ET`, {
    x: 48,
    y,
    size: 9,
    font,
    color: muted,
  });
  y -= 14;
  page.drawText("This document was electronically signed and constitutes acceptance of the estimate.", {
    x: 48,
    y,
    size: 8,
    font,
    color: muted,
  });

  return pdf.save();
}
