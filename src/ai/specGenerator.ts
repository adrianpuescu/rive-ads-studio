/**
 * AI AdSpec Generator
 * 
 * Calls Claude API to generate valid AdSpec objects from natural language prompts.
 */

import type { AdSpec } from '../types/ad-spec.schema';
import type { BrandTokens } from '../types/brand-tokens';
import { getBrandTokensPromptBlock } from '../types/brand-tokens';

export interface GeneratorOptions {
  prompt: string;
  templateId?: string;  // defaults to 'test-template'
  brandTokens?: BrandTokens | null;
}

export interface GeneratorResult {
  spec: AdSpec;
  raw: string;  // raw JSON string for debugging
}

const SYSTEM_PROMPT = `
You are the creative AI engine for RiveAds Studio, an artistic ad creation platform.

Your job is to take a user's brief and return a single valid AdSpec JSON object.

Rules:
- Return ONLY raw JSON. No markdown, no backticks, no explanation, no preamble.
- Every field must conform to the AdSpec schema exactly.
- template.id must be "test-template".
- template.artboard must be "Banner 728x90".
- template.stateMachine must be "State Machine 1".
- text values must be short, punchy, and artistic — not generic marketing copy.
- Headline: max 4 words. CTA: max 3 words.
- Do NOT generate tagline. This template does not have a tagline slot.
- Colors must form a cohesive, intentional palette. Never use random or clashing colors.
- stateInputs.speed: dreamy/slow = 0.3–0.5, neutral = 0.8–1.0, energetic = 1.2–2.0
- stateInputs.intensity: subtle = 0.1–0.3, balanced = 0.4–0.6, bold = 0.7–1.0
- stateInputs.mood must be exactly "dreamy" (the only available mood in this template).
- Always populate generation.rationale with 1-2 sentences explaining the creative choices.
- version must be "1.0".
- format.size must be { "preset": "leaderboard" }.
- format.loop must be true.

AdSpec schema for reference:
{
  version: "1.0",
  id: string (generate a short uuid),
  createdAt: string (ISO timestamp),
  template: { id, artboard, stateMachine },
  format: { size: AdSize, durationMs: number, loop: boolean },
  text: {
    headline?: { value: string },
    subheadline?: { value: string },
    body?: { value: string },
    cta?: { value: string },
    tagline?: { value: string },
    custom?: Record<string, { value: string }>
  },
  colors: { primary: string, secondary: string, background: string, accent?: string },
  assets: {},
  stateInputs: { speed?: number, intensity?: number, mood?: string },
  generation: { prompt: string, model: string, rationale: string, variantIndex: number }
}
`;

/**
 * Generates an AdSpec from a natural language prompt using Claude API
 */
export async function generateAdSpec(
  options: GeneratorOptions
): Promise<GeneratorResult> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY is not configured');
  }

  const systemPrompt =
    options.brandTokens != null
      ? getBrandTokensPromptBlock(options.brandTokens) + '\n\n' + SYSTEM_PROMPT
      : SYSTEM_PROMPT;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      // model: 'claude-sonnet-4-20250514',
      model: 'claude-haiku-4-5-20251001', // Temp - E mai rapid și mai ieftin, dar la fel de capabil pentru generare JSON. Poți reveni la Sonnet când overload-ul trece.
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: options.prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const raw = data.content[0].text;

  // Strip any accidental markdown fences
  const clean = raw.replace(/```json|```/g, '').trim();

  let spec: AdSpec;
  try {
    spec = JSON.parse(clean);
  } catch (err) {
    throw new Error(`AI returned invalid JSON: ${clean}`);
  }

  // Inject generation metadata
  spec.generation = {
    prompt: options.prompt,
    model: 'claude-sonnet-4-20250514',
    rationale: spec.generation?.rationale ?? '',
    variantIndex: 0
  };

  return { spec, raw };
}
