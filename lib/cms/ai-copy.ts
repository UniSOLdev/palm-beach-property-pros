/** Rule-based copy enhancement — premium tone without external API dependency. */

const LUXURY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bcleaning\b/gi, "property care"],
  [/\bcheap\b/gi, "exceptional value"],
  [/\bbest\b/gi, "premier"],
  [/\bgood\b/gi, "exceptional"],
  [/\bnice\b/gi, "refined"],
  [/\bfast\b/gi, "responsive"],
  [/\bquick\b/gi, "efficient"],
  [/\bwe do\b/gi, "we deliver"],
  [/\bour service\b/gi, "our white-glove service"],
];

const HEADLINE_SUFFIXES = [
  " — Palm Beach Property Pros",
  " | Premium Property Care",
  " in Palm Beach County",
];

function capitalizeSentence(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function applyLuxuryTone(text: string): string {
  let result = text;
  for (const [pattern, replacement] of LUXURY_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function enhanceHeadline(input: string): string {
  let text = capitalizeSentence(applyLuxuryTone(input));
  if (text.length > 0 && text.length < 40 && !text.includes("Palm Beach")) {
    text += " in Palm Beach County";
  }
  return text;
}

export function enhanceBody(input: string): string {
  const sentences = input
    .split(/(?<=[.!?])\s+/)
    .map((s) => capitalizeSentence(applyLuxuryTone(s)))
    .filter(Boolean);
  return sentences.join(" ");
}

export function enhanceSeoTitle(input: string, brand = "Palm Beach Property Pros"): string {
  let title = capitalizeSentence(applyLuxuryTone(input));
  if (!title.toLowerCase().includes(brand.toLowerCase()) && title.length < 50) {
    title = `${title}${HEADLINE_SUFFIXES[0]}`;
  }
  if (title.length > 60) title = title.slice(0, 57) + "…";
  return title;
}

export function enhanceMetaDescription(input: string): string {
  let desc = capitalizeSentence(applyLuxuryTone(input));
  if (desc.length < 120) {
    desc += " Trusted by discerning homeowners and property managers across Palm Beach County.";
  }
  if (desc.length > 160) desc = desc.slice(0, 157) + "…";
  return desc;
}

export function suggestSectionCopy(sectionType: string): { headline: string; body: string } {
  const suggestions: Record<string, { headline: string; body: string }> = {
    hero: {
      headline: "Property Care for Palm Beach Living",
      body: "White-glove residential and commercial services — windows, maintenance, and coastal property care.",
    },
    services: {
      headline: "Comprehensive Property Services",
      body: "From routine maintenance to specialty care, every service is delivered with precision and discretion.",
    },
    testimonials: {
      headline: "Trusted by Palm Beach Property Owners",
      body: "Our clients expect excellence. We deliver it consistently.",
    },
    cta: {
      headline: "Ready for Premium Property Care?",
      body: "Request a quote today. We respond within one business day with clear scope and pricing.",
    },
    gallery: {
      headline: "Our Work Speaks for Itself",
      body: "Before-and-after results from properties across Palm Beach County.",
    },
  };
  return suggestions[sectionType] ?? {
    headline: "Elevate Your Property",
    body: "Professional care tailored to Palm Beach standards.",
  };
}
