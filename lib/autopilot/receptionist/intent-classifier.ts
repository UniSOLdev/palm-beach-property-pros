import "server-only";

export type SmsIntent = "quote" | "emergency" | "status" | "general";

export type IntentClassification = {
  intent: SmsIntent;
  confidence: "high" | "medium" | "low";
  source: "keyword" | "openai";
};

const EMERGENCY_KEYWORDS = [
  "emergency",
  "urgent",
  "asap",
  "flood",
  "flooding",
  "water damage",
  "leak",
  "leaking",
  "burst pipe",
  "fire",
  "sewage",
  "help now",
  "immediate",
];

const STATUS_KEYWORDS = [
  "status",
  "update",
  "when are you",
  "when will",
  "appointment",
  "scheduled",
  "eta",
  "follow up",
  "follow-up",
  "running late",
  "on the way",
  "where is",
  "job status",
];

const QUOTE_KEYWORDS = [
  "quote",
  "estimate",
  "price",
  "pricing",
  "cost",
  "how much",
  "bid",
  "proposal",
  "need service",
  "looking for",
  "interested in",
  "can you do",
  "do you do",
];

function scoreKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((score, keyword) => (lower.includes(keyword) ? score + 1 : score), 0);
}

function classifyByKeywords(message: string): IntentClassification {
  const text = message.trim();
  const scores = {
    emergency: scoreKeywords(text, EMERGENCY_KEYWORDS),
    status: scoreKeywords(text, STATUS_KEYWORDS),
    quote: scoreKeywords(text, QUOTE_KEYWORDS),
  };

  const maxScore = Math.max(scores.emergency, scores.status, scores.quote);
  if (maxScore === 0) {
    return { intent: "general", confidence: "low", source: "keyword" };
  }

  if (scores.emergency === maxScore && scores.emergency > 0) {
    return {
      intent: "emergency",
      confidence: scores.emergency >= 2 ? "high" : "medium",
      source: "keyword",
    };
  }
  if (scores.status === maxScore && scores.status > 0) {
    return {
      intent: "status",
      confidence: scores.status >= 2 ? "high" : "medium",
      source: "keyword",
    };
  }
  if (scores.quote === maxScore && scores.quote > 0) {
    return {
      intent: "quote",
      confidence: scores.quote >= 2 ? "high" : "medium",
      source: "keyword",
    };
  }

  return { intent: "general", confidence: "medium", source: "keyword" };
}

async function classifyWithOpenAI(message: string, apiKey: string): Promise<IntentClassification> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_RECEPTIONIST_MODEL?.trim() || "gpt-4.1-mini",
        temperature: 0,
        max_tokens: 60,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Classify inbound SMS for Palm Beach Property Pros (property restoration, cleaning, maintenance). Return JSON: {"intent":"quote"|"emergency"|"status"|"general"}. Use emergency for floods/leaks/urgent damage; status for appointment/job updates; quote for pricing/estimates/new work; general otherwise.',
          },
          { role: "user", content: message.slice(0, 2000) },
        ],
      }),
    });

    if (!res.ok) {
      return classifyByKeywords(message);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return classifyByKeywords(message);

    const parsed = JSON.parse(raw) as { intent?: string };
    const intent = parsed.intent;
    if (intent === "quote" || intent === "emergency" || intent === "status" || intent === "general") {
      return { intent, confidence: "medium", source: "openai" };
    }
    return classifyByKeywords(message);
  } catch {
    return classifyByKeywords(message);
  } finally {
    clearTimeout(timer);
  }
}

/** Classify SMS intent using keywords, with optional OpenAI when ambiguous. */
export async function classifySmsIntent(
  message: string,
  options?: { useOpenAI?: boolean },
): Promise<IntentClassification> {
  const keywordResult = classifyByKeywords(message);
  if (keywordResult.confidence === "high") return keywordResult;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const useOpenAI = options?.useOpenAI ?? true;
  if (apiKey && useOpenAI && keywordResult.confidence === "low") {
    return classifyWithOpenAI(message, apiKey);
  }

  return keywordResult;
}
