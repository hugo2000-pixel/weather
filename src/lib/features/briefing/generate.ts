// AI Morning Briefing generator
// Uses the Anthropic API with a user-supplied key (stored in localStorage via settings)
// Never stores or logs API keys. Key is read from the Zustand settings store.

import { z } from "zod";

const AnthropicResponseSchema = z.object({
  content: z.array(
    z.object({
      type: z.literal("text"),
      text: z.string(),
    })
  ),
});

export type BriefingContext = {
  location: string;
  tempC: number;
  weatherLabel: string;
  feelsLikeC: number;
  uvIndex: number;
  anomalyNarrative: string;
  topActivities: Array<{ label: string; score: number }>;
  alerts: string[];
};

function buildPrompt(ctx: BriefingContext): string {
  return `You are a friendly, concise weather assistant. Write a 3-4 sentence morning briefing in the user's language based on this data:

Location: ${ctx.location}
Current: ${ctx.tempC}°C (feels like ${ctx.feelsLikeC}°C), ${ctx.weatherLabel}, UV ${ctx.uvIndex}
Climate context: ${ctx.anomalyNarrative}
Top activities today: ${ctx.topActivities.map((a) => `${a.label} (score ${a.score}/3)`).join(", ")}
Active alerts: ${ctx.alerts.length > 0 ? ctx.alerts.join("; ") : "none"}

Keep it warm, natural, and actionable. Maximum 4 sentences.`;
}

export async function generateBriefing(
  ctx: BriefingContext,
  apiKey: string
): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error("No Anthropic API key provided. Add it in Settings.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      // Required for browser CORS: direct call only works if Anthropic allows it
      // In production you'd proxy this through a Next.js API route
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: buildPrompt(ctx) }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = AnthropicResponseSchema.parse(await res.json());
  const text = data.content[0]?.text;
  if (!text) throw new Error("Empty response from AI.");
  return text;
}
