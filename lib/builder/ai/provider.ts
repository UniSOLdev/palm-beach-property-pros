/**
 * AI provider abstraction — swap implementations without coupling to OpenAI.
 */

export type AICompletionRequest = {
  prompt: string;
  system?: string;
  maxTokens?: number;
  temperature?: number;
};

export type AICompletionResult = {
  text: string;
  provider: string;
};

export interface AIProvider {
  readonly name: string;
  complete(request: AICompletionRequest): Promise<AICompletionResult>;
}

/** Rule-based fallback when no external AI is configured. */
export class LocalAIProvider implements AIProvider {
  readonly name = "local";

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    const { enhanceBody, enhanceHeadline, enhanceMetaDescription, enhanceSeoTitle } = await import(
      "@/lib/cms/ai-copy"
    );
    const p = request.prompt.toLowerCase();
    let text = request.prompt;

    if (p.includes("seo") || p.includes("meta")) text = enhanceMetaDescription(request.prompt);
    else if (p.includes("title")) text = enhanceSeoTitle(request.prompt);
    else if (p.includes("headline") || p.includes("hero")) text = enhanceHeadline(request.prompt);
    else if (p.includes("luxury") || p.includes("palm beach")) text = enhanceBody(request.prompt);
    else text = enhanceBody(request.prompt);

    return { text, provider: this.name };
  }
}

/** Placeholder for future OpenAI / Anthropic / etc. */
export class HttpAIProvider implements AIProvider {
  readonly name: string;

  constructor(
    private endpoint: string,
    private apiKey: string,
    name = "http",
  ) {
    this.name = name;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`AI provider error: ${res.status}`);
    const data = (await res.json()) as { text?: string };
    return { text: data.text ?? "", provider: this.name };
  }
}

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const endpoint = process.env.AI_COMPLETION_ENDPOINT;
  const apiKey = process.env.AI_API_KEY;

  if (endpoint && apiKey) {
    cachedProvider = new HttpAIProvider(endpoint, apiKey, process.env.AI_PROVIDER_NAME ?? "custom");
  } else {
    cachedProvider = new LocalAIProvider();
  }

  return cachedProvider;
}

export function resetAIProvider() {
  cachedProvider = null;
}
