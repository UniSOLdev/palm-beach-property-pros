import "server-only";
import { isAutopilotOpenAiEnabled } from "@/lib/autopilot/config";
import type { OutreachProspectRow } from "@/lib/admin/types-outreach";
import { PROSPECT_PITCH_SNIPPET } from "@/lib/admin/outreach/constants";
import { PHONE_DISPLAY, SITE_NAME, SITE_URL } from "@/lib/site";

export type PitchInput = {
  prospect: OutreachProspectRow;
  stepTemplate: string;
  stepIndex: number;
  sequenceName: string;
};

export type PitchDraft = {
  subject: string;
  body: string;
};

function greeting(prospect: OutreachProspectRow): string {
  const name = prospect.contact_name?.trim();
  return name ? `Hi ${name.split(" ")[0]},` : "Hi there,";
}

function ruleBasedDraft(input: PitchInput): PitchDraft {
  const { prospect, stepTemplate, stepIndex } = input;
  const hi = greeting(prospect);
  const company = prospect.company_name;
  const pitch = PROSPECT_PITCH_SNIPPET;

  const templates: Record<string, PitchDraft> = {
    pm_intro: {
      subject: `Vendor partner for your portfolio — ${SITE_NAME}`,
      body: `${hi}

I'm with ${SITE_NAME}, a local property services team serving Palm Beach County (33407 area). We support property managers with recurring yard care, move-out cleans, pressure washing, and window cleaning — with photo documentation on every visit.

${pitch}

Would you be open to a quick call this week to see if we fit your vendor list?

— ${SITE_NAME}
${PHONE_DISPLAY} · ${SITE_URL}`,
    },
    pm_follow_up_1: {
      subject: `Following up — ${SITE_NAME} for ${company}`,
      body: `${hi}

Quick follow-up on my note about vendor support for ${company}. We handle bi-weekly maintenance and turnover work for several local portfolios — reliable scheduling, no carpentry.

Happy to send a one-page vendor sheet or meet on-site at a property you manage.

— ${SITE_NAME}
${PHONE_DISPLAY}`,
    },
    pm_follow_up_2: {
      subject: `Last note — local vendor for ${company}`,
      body: `${hi}

I'll keep this brief — if timing isn't right for ${company}, no worries. We're here when you need a dependable local crew for yards, cleans, and exterior maintenance.

Feel free to save our number: ${PHONE_DISPLAY}.

— ${SITE_NAME}`,
    },
    str_intro: {
      subject: `Turnover & exterior help for your STR — ${SITE_NAME}`,
      body: `${hi}

We work with Airbnb and short-term rental operators near West Palm / 33407 on fast turn cleans, yard resets, and pressure washing between guests.

${pitch}

If ${company} ever needs backup on turnover days, we'd love to connect.

— ${SITE_NAME}
${PHONE_DISPLAY} · ${SITE_URL}`,
    },
    str_follow_up: {
      subject: `Re: turnover support for ${company}`,
      body: `${hi}

Following up in case turnover season is picking up. We can often same-week schedule yard + clean bundles for STR properties.

Reply with an address and we can quote a test turnover.

— ${SITE_NAME}
${PHONE_DISPLAY}`,
    },
    landlord_intro: {
      subject: `Local maintenance for ${company} — ${SITE_NAME}`,
      body: `${hi}

I'm reaching out from ${SITE_NAME}. We help landlords and small owners with recurring yard care, move-out cleans, and exterior maintenance — residential focus, no carpentry.

${pitch}

Open to a quick call if ${company} has properties that need a steady local vendor?

— ${SITE_NAME}
${PHONE_DISPLAY}`,
    },
    landlord_follow_up: {
      subject: `Following up — ${SITE_NAME}`,
      body: `${hi}

Checking back on vendor support for ${company}. We document every job with photos and keep scheduling simple.

Text or call anytime: ${PHONE_DISPLAY}.

— ${SITE_NAME}`,
    },
  };

  if (templates[stepTemplate]) return templates[stepTemplate];

  const isFollowUp = stepIndex > 0;
  return {
    subject: isFollowUp
      ? `Following up — ${SITE_NAME} & ${company}`
      : `Local property services — ${SITE_NAME}`,
    body: `${hi}

${isFollowUp ? "Following up on my earlier note." : "Reaching out from " + SITE_NAME + "."} ${pitch}

— ${SITE_NAME}
${PHONE_DISPLAY} · ${SITE_URL}`,
  };
}

async function openAiDraft(input: PitchInput): Promise<PitchDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const { prospect, stepTemplate, stepIndex, sequenceName } = input;
  const hi = greeting(prospect);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_OUTREACH_MODEL?.trim() || "gpt-4.1-mini",
        temperature: 0.6,
        max_tokens: 600,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You write concise B2B outreach emails for ${SITE_NAME}, a Palm Beach County property services company (yard care, cleaning, pressure wash, windows — no carpentry). Return JSON: {"subject":"...","body":"..."}. Professional, local, not salesy. Include phone ${PHONE_DISPLAY}. Do not invent fake testimonials.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              sequence: sequenceName,
              step: stepIndex,
              template_key: stepTemplate,
              greeting: hi,
              company: prospect.company_name,
              contact: prospect.contact_name,
              prospect_type: prospect.prospect_type,
              pitch_notes: prospect.pitch_notes,
              core_pitch: PROSPECT_PITCH_SNIPPET,
            }),
          },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { subject?: string; body?: string };
    if (!parsed.subject?.trim() || !parsed.body?.trim()) return null;

    return { subject: parsed.subject.trim(), body: parsed.body.trim() };
  } catch {
    return null;
  }
}

export async function generatePitchDraft(input: PitchInput): Promise<PitchDraft> {
  if (isAutopilotOpenAiEnabled()) {
    const ai = await openAiDraft(input);
    if (ai) return ai;
  }
  return ruleBasedDraft(input);
}
