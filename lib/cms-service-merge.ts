import type { ServiceDefinition } from "@/lib/services";

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function strArr(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.map((x) => String(x)).filter(Boolean);
  return out.length ? out : undefined;
}

function faqArr(v: unknown): { q: string; a: string }[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: { q: string; a: string }[] = [];
  for (const row of v) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const q = str(o.q ?? o.question);
    const a = str(o.a ?? o.answer);
    if (q && a) out.push({ q, a });
  }
  return out.length ? out : undefined;
}

export function mergeServiceWithCmsOverlay(
  base: ServiceDefinition,
  overlay: Record<string, unknown> | null,
): ServiceDefinition {
  if (!overlay) return base;
  const name = str(overlay.name);
  const shortDescription = str(overlay.shortDescription);
  const bestFor = str(overlay.bestFor);
  const headline = str(overlay.headline);
  const authorityIntro = str(overlay.authorityIntro);
  const included = strArr(overlay.included);
  const whoItsFor = strArr(overlay.whoItsFor);
  const process = strArr(overlay.process);
  const startingPriceLabel = str(overlay.startingPriceLabel);
  const faq = faqArr(overlay.faq);
  return {
    ...base,
    ...(name ? { name } : {}),
    ...(shortDescription ? { shortDescription } : {}),
    ...(bestFor ? { bestFor } : {}),
    ...(headline ? { headline } : {}),
    ...(authorityIntro ? { authorityIntro } : {}),
    ...(included ? { included } : {}),
    ...(whoItsFor ? { whoItsFor } : {}),
    ...(process ? { process } : {}),
    ...(startingPriceLabel ? { startingPriceLabel } : {}),
    ...(faq ? { faq } : {}),
  } as ServiceDefinition;
}
