import "server-only";

import { getAIProvider } from "@/lib/builder/ai/provider";

export type AIAssistTask =
  | "project_description"
  | "service_description"
  | "customer_email"
  | "customer_text"
  | "social_caption"
  | "seo_improvement";

const SYSTEM_PROMPTS: Record<AIAssistTask, string> = {
  project_description:
    "You write concise, truthful case-study copy for a Palm Beach County property services company. No fake claims or invented reviews.",
  service_description:
    "You write clear, benefit-led service descriptions for window detailing, pressure washing, and property care. Mention scope honestly.",
  customer_email:
    "You draft short, professional customer emails for a local service business. Friendly, clear, no hype.",
  customer_text:
    "You draft brief SMS messages for a field service owner. Under 320 characters when possible.",
  social_caption:
    "You write social media captions for before/after project photos. No fake stats or licenses.",
  seo_improvement:
    "You suggest SEO improvements for local service business pages in Palm Beach County. Be specific and honest.",
};

export async function runAIAssist(task: AIAssistTask, context: string): Promise<{ text: string; provider: string }> {
  const provider = getAIProvider();
  const result = await provider.complete({
    system: SYSTEM_PROMPTS[task],
    prompt: context,
    maxTokens: 800,
  });
  return { text: result.text.trim(), provider: result.provider };
}
