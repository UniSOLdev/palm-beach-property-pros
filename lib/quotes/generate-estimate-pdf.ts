import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { calculateEstimateTotals, type QuoteLineInput } from "@/lib/platform/modules/estimates";
import { SITE_NAME } from "@/lib/site";

type EstimatePdfInput = {
  quoteNumber: string;
  clientName: string;
  serviceType: string;
  jobAddress: string;
  expirationDate?: string | null;
  notes?: string | null;
  terms?: string | null;
  lines: QuoteLineInput[];
  discount_type?: "percent" | "fixed" | null;
  discount_value?: number;
  tax_rate?: number;
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

export async function generateEstimatePdf(input: EstimatePdfInput): Promise<Uint8Array> {
  const totals = calculateEstimateTotals(input.lines, {
    discount_type: input.discount_type,
    discount_value: input.discount_value,
    tax_rate: input.tax_rate,
  });

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
  page.drawText("Estimate", { x: 48, y, size: 22, font: fontBold, color: navy });
  y -= 18;
  page.drawText(input.quoteNumber, { x: 48, y, size: 11, font, color: muted });
  y -= 28;

  for (const line of [
    `Client: ${input.clientName}`,
    `Service: ${input.serviceType}`,
    `Property: ${input.jobAddress}`,
    input.expirationDate ? `Valid through: ${formatDate(input.expirationDate)}` : null,
  ].filter(Boolean) as string[]) {
    page.drawText(line, { x: 48, y, size: 10, font, color: charcoal });
    y -= 14;
  }

  y -= 10;
  page.drawLine({ start: { x: 48, y }, end: { x: 564, y }, thickness: 1, color: rgb(0.88, 0.88, 0.88) });
  y -= 22;

  page.drawText("Line items", { x: 48, y, size: 11, font: fontBold, color: navy });
  y -= 18;

  for (const item of input.lines) {
    const amount = formatCurrency(Number(item.quantity) * Number(item.unit_price));
    for (const [i, descLine] of wrapText(item.description, 52).entries()) {
      page.drawText(descLine, { x: 48, y, size: 10, font, color: charcoal });
      if (i === 0) page.drawText(amount, { x: 480, y, size: 10, font: fontBold, color: navy });
      y -= 14;
      if (y < 120) break;
    }
  }

  y -= 8;
  page.drawText(`Subtotal: ${formatCurrency(totals.subtotal)}`, { x: 400, y, size: 10, font, color: charcoal });
  y -= 14;
  if (totals.discount > 0) {
    page.drawText(`Discount: -${formatCurrency(totals.discount)}`, { x: 400, y, size: 10, font, color: charcoal });
    y -= 14;
  }
  if (totals.tax > 0) {
    page.drawText(`Tax: ${formatCurrency(totals.tax)}`, { x: 400, y, size: 10, font, color: charcoal });
    y -= 14;
  }
  page.drawText(`Total: ${formatCurrency(totals.total)}`, { x: 400, y, size: 12, font: fontBold, color: navy });

  if (input.notes) {
    y -= 30;
    page.drawText("Notes", { x: 48, y, size: 11, font: fontBold, color: navy });
    y -= 16;
    for (const line of wrapText(input.notes, 80).slice(0, 6)) {
      page.drawText(line, { x: 48, y, size: 9, font, color: muted });
      y -= 12;
    }
  }

  return pdf.save();
}
