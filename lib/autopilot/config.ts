import "server-only";

/** `free` (default) — email + tasks only. `paid` — enables SMS, voice, Stripe, OpenAI when keys are set. */
export type AutopilotTier = "free" | "paid";

export function getAutopilotTier(): AutopilotTier {
  const tier = process.env.AUTOPILOT_TIER?.trim().toLowerCase();
  return tier === "paid" ? "paid" : "free";
}

export function isFreeTier(): boolean {
  return getAutopilotTier() === "free";
}

export function isPaidTier(): boolean {
  return !isFreeTier();
}

export type AutopilotFeatureStatus = {
  enabled: boolean;
  reason?: string;
};

export function emailFeatureStatus(): AutopilotFeatureStatus {
  const hasKey = Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
  return {
    enabled: hasKey,
    reason: hasKey ? undefined : "Add RESEND_API_KEY + RESEND_FROM_EMAIL (Resend free tier: 100/day)",
  };
}

export function smsFeatureStatus(): AutopilotFeatureStatus {
  if (isFreeTier()) {
    return { enabled: false, reason: "Free tier — email only. Set AUTOPILOT_TIER=paid + Twilio to enable SMS." };
  }
  const hasTwilio = Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_PHONE_NUMBER?.trim(),
  );
  return {
    enabled: hasTwilio,
    reason: hasTwilio ? undefined : "Add Twilio credentials",
  };
}

export function voiceFeatureStatus(): AutopilotFeatureStatus {
  return smsFeatureStatus();
}

export function stripeFeatureStatus(): AutopilotFeatureStatus {
  if (isFreeTier()) {
    return { enabled: false, reason: "Free tier — track payments manually in admin. Set AUTOPILOT_TIER=paid + Stripe to enable." };
  }
  const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  return {
    enabled: hasStripe,
    reason: hasStripe ? undefined : "Add STRIPE_SECRET_KEY",
  };
}

export function openAiFeatureStatus(): AutopilotFeatureStatus {
  if (isFreeTier()) {
    return { enabled: false, reason: "Free tier — rule-based copy only. Set AUTOPILOT_TIER=paid + OPENAI_API_KEY to enable." };
  }
  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  return {
    enabled: hasKey,
    reason: hasKey ? undefined : "Add OPENAI_API_KEY (optional)",
  };
}

/** Always available — Supabase + Next.js task engine. */
export function taskRulesFeatureStatus(): AutopilotFeatureStatus {
  return { enabled: true };
}

export type AutopilotTierSummary = {
  tier: AutopilotTier;
  features: {
    taskRules: AutopilotFeatureStatus;
    email: AutopilotFeatureStatus;
    sms: AutopilotFeatureStatus;
    voice: AutopilotFeatureStatus;
    stripe: AutopilotFeatureStatus;
    openAi: AutopilotFeatureStatus;
  };
  cronHint: string;
};

export function getAutopilotTierSummary(): AutopilotTierSummary {
  return {
    tier: getAutopilotTier(),
    features: {
      taskRules: taskRulesFeatureStatus(),
      email: emailFeatureStatus(),
      sms: smsFeatureStatus(),
      voice: voiceFeatureStatus(),
      stripe: stripeFeatureStatus(),
      openAi: openAiFeatureStatus(),
    },
    cronHint:
      "Schedule jobs free via cron-job.org → hit /api/cron/* with Authorization: Bearer CRON_SECRET",
  };
}

/** Gate SMS sends — returns false on free tier regardless of Twilio keys. */
export function isSmsEnabled(): boolean {
  return smsFeatureStatus().enabled;
}

/** Gate Stripe — returns false on free tier. */
export function isStripeEnabled(): boolean {
  return stripeFeatureStatus().enabled;
}

/** Gate OpenAI for autopilot copy — receipt OCR uses OPENAI_API_KEY separately. */
export function isAutopilotOpenAiEnabled(): boolean {
  return openAiFeatureStatus().enabled;
}
