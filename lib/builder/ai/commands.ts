import { getAIProvider } from "@/lib/builder/ai/provider";
import { suggestSectionCopy } from "@/lib/cms/ai-copy";
import { enhanceMetaDescription, enhanceSeoTitle } from "@/lib/cms/ai-copy";
import type { WebsiteSectionType } from "@/lib/cms/section-registry";

export type BuilderAICommand =
  | "make_luxury"
  | "rewrite_cta"
  | "improve_seo"
  | "generate_testimonials"
  | "generate_faq"
  | "generate_palm_beach_copy"
  | "generate_homepage"
  | "generate_service_page"
  | "generate_city_page";

export type BuilderAIContext = {
  sectionType?: WebsiteSectionType;
  currentText?: string;
  pageTitle?: string;
  city?: string;
  service?: string;
};

export type BuilderAIResult = {
  command: BuilderAICommand;
  output: string | Record<string, unknown>;
  provider: string;
};

const COMMAND_PROMPTS: Record<BuilderAICommand, string> = {
  make_luxury: "Rewrite this copy with a luxury Palm Beach property care tone",
  rewrite_cta: "Rewrite this call-to-action to be compelling and action-oriented",
  improve_seo: "Improve SEO meta description for a Palm Beach property services company",
  generate_testimonials: "Generate 3 premium client testimonials for property care services",
  generate_faq: "Generate 5 FAQ items for a luxury property services company in Palm Beach",
  generate_palm_beach_copy: "Write premium Palm Beach coastal property care marketing copy",
  generate_homepage: "Generate a complete homepage structure for a luxury field service company",
  generate_service_page: "Generate service page content for a home services company",
  generate_city_page: "Generate city SEO landing page content for Palm Beach County",
};

export async function runBuilderAICommand(
  command: BuilderAICommand,
  context: BuilderAIContext = {},
): Promise<BuilderAIResult> {
  const provider = getAIProvider();
  const basePrompt = context.currentText ?? COMMAND_PROMPTS[command];

  switch (command) {
    case "improve_seo":
      return {
        command,
        output: enhanceMetaDescription(context.currentText ?? ""),
        provider: provider.name,
      };
    case "generate_homepage": {
      const hero = suggestSectionCopy("hero");
      const cta = suggestSectionCopy("cta");
      return {
        command,
        output: {
          sections: [
            { type: "hero", content: hero },
            { type: "services", content: suggestSectionCopy("services") },
            { type: "testimonials", content: suggestSectionCopy("testimonials") },
            { type: "cta", content: cta },
          ],
          seo: {
            seo_title: enhanceSeoTitle(context.pageTitle ?? "Palm Beach Property Pros"),
            meta_description: enhanceMetaDescription(
              "Premium property care for Palm Beach County homes and commercial properties.",
            ),
          },
        },
        provider: provider.name,
      };
    }
    case "generate_service_page": {
      const result = await provider.complete({
        system: "You write premium home service marketing copy.",
        prompt: `Service: ${context.service ?? "property maintenance"}. ${basePrompt}`,
      });
      return { command, output: result.text, provider: result.provider };
    }
    case "generate_city_page": {
      const city = context.city ?? "West Palm Beach";
      const result = await provider.complete({
        prompt: `City SEO page for ${city}, Palm Beach County. ${basePrompt}`,
      });
      return { command, output: result.text, provider: result.provider };
    }
    default: {
      const result = await provider.complete({
        system: context.sectionType
          ? `Editing a ${context.sectionType} section for a luxury property services website.`
          : undefined,
        prompt: basePrompt,
      });
      return { command, output: result.text, provider: result.provider };
    }
  }
}

export function parseAICommand(input: string): BuilderAICommand | null {
  const q = input.toLowerCase().trim();
  if (q.includes("luxury")) return "make_luxury";
  if (q.includes("cta") || q.includes("call to action")) return "rewrite_cta";
  if (q.includes("seo")) return "improve_seo";
  if (q.includes("testimonial")) return "generate_testimonials";
  if (q.includes("faq")) return "generate_faq";
  if (q.includes("palm beach")) return "generate_palm_beach_copy";
  if (q.includes("homepage") || q.includes("home page")) return "generate_homepage";
  if (q.includes("service page")) return "generate_service_page";
  if (q.includes("city")) return "generate_city_page";
  return null;
}
