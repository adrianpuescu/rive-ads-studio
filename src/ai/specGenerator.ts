/**
 * AI AdSpec Generator
 * 
 * Calls Claude API to generate valid AdSpec objects from natural language prompts.
 */

import type { AdSpec } from '../types/ad-spec.schema';
import type { BrandTokens } from '../types/brand-tokens';
import { getBrandTokensPromptBlock } from '../types/brand-tokens';

export interface ActiveBrandForPrompt {
  name: string;
  tokens: BrandTokens;
}

export interface GeneratorOptions {
  prompt: string;
  templateId?: string;  // defaults to 'test-template'
  /** When set, brand block is prepended to system prompt. */
  activeBrand?: ActiveBrandForPrompt | null;
}

export interface GeneratorResult {
  spec: AdSpec;
  raw: string;  // raw JSON string for debugging
}

const NO_BRAND_COLOR_INSTRUCTIONS = `
No brand tokens are set. Use full creative freedom.
Choose colors that genuinely fit the mood, subject, and style
of the user's prompt.
Each variant MUST have a distinctly different color palette
from the other two — different hues, different energy.
Avoid repeating the same backgroundColor across variants.
Be intentional and artistic — the palette should feel
designed, not random.
If the user specifies colors in their prompt,
use those as the base and adapt the palette around them.
`;

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
${NO_BRAND_COLOR_INSTRUCTIONS}
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
  colors: { primary: string, secondary: string, background: string, accent?: string, headlineColor: string, subheadlineColor: string, ctaColor: string },
  assets: {},
  stateInputs: { speed?: number, intensity?: number, mood?: string },
  generation: { prompt: string, model: string, rationale: string, variantIndex: number }
}
`;

/** System prompt rules only (before schema). Brand block is inserted between this and SCHEMA when active. */
const SYSTEM_PROMPT_RULES = `
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
- Generate headlineColor, subheadlineColor, and ctaColor as hex strings. Ensure sufficient contrast with backgroundColor at all times.
- headlineColor: the most prominent text (white, black, or a strong accent that contrasts with background).
- subheadlineColor: a subtler shade than the headline (e.g. softer gray or muted variant).
- ctaColor: must stand out from the rest of the text (high contrast, often accent or complementary).
- NEVER use the same hex for any text color and the background; text and background must always differ.
- stateInputs.speed: dreamy/slow = 0.3–0.5, neutral = 0.8–1.0, energetic = 1.2–2.0
- stateInputs.intensity: subtle = 0.1–0.3, balanced = 0.4–0.6, bold = 0.7–1.0
- stateInputs.mood must be exactly "dreamy" (the only available mood in this template).
- Always populate generation.rationale with 1-2 sentences explaining the creative choices.
- version must be "1.0".
- format.size must be { "preset": "leaderboard" }.
- format.loop must be true.
`;

const SYSTEM_PROMPT_SCHEMA = `
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
  colors: { primary: string, secondary: string, background: string, accent?: string, headlineColor: string, subheadlineColor: string, ctaColor: string },
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

  const hasActiveBrand = options.activeBrand != null;
  const activeBrand = options.activeBrand;
  const systemPrompt =
    hasActiveBrand && activeBrand != null
      ? SYSTEM_PROMPT_RULES + '\n\n' + getBrandTokensPromptBlock(activeBrand.name, activeBrand.tokens) + SYSTEM_PROMPT_SCHEMA
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
  } catch {
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

export const VARIANT_STYLE_LABELS: ReadonlyArray<string> = ['Bold', 'Elegant', 'Warm'];

const VARIANT_COMMON_COLORS =
  'The color palette must be completely different from the other variants. Choose colors that genuinely fit the subject matter of the ad. If the user specifies colors in their prompt, use those instead.';

const VARIANT_STYLE_SUFFIXES: ReadonlyArray<string> = [
  `Generate variant 1 of 3: BOLD style.
BOLD style: high energy, strong contrast, commanding presence.
Choose colors that fit the subject AND feel bold and confident.

${VARIANT_COMMON_COLORS}`,
  `Generate variant 2 of 3: ELEGANT style.
ELEGANT style: sophisticated, refined, premium feel.
Choose colors that fit the subject AND feel luxurious and understated.

${VARIANT_COMMON_COLORS}`,
  `Generate variant 3 of 3: WARM style.
WARM style: inviting, optimistic, approachable energy.
Choose colors that fit the subject AND feel friendly and welcoming.
Warm style refers to the emotional warmth, not necessarily warm color temperatures —
a warm ocean scene can use warm blues and soft aquas.

${VARIANT_COMMON_COLORS}`,
];

/**
 * Generates a single AdSpec with the given variant style (1, 2, or 3).
 * Used for retrying a failed variant slot.
 */
export async function generateSingleVariant(
  prompt: string,
  brandTokens: ActiveBrandForPrompt | null | undefined,
  variantIndex: 1 | 2 | 3
): Promise<AdSpec | null> {
  const systemSuffix = VARIANT_STYLE_SUFFIXES[variantIndex - 1];
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const baseSystem =
    brandTokens != null
      ? SYSTEM_PROMPT_RULES + '\n\n' + getBrandTokensPromptBlock(brandTokens.name, brandTokens.tokens) + SYSTEM_PROMPT_SCHEMA
      : SYSTEM_PROMPT;
  const systemPrompt = baseSystem + '\n\n' + systemSuffix;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const raw = data.content[0].text;
  const clean = raw.replace(/```json|```/g, '').trim();
  let spec: AdSpec;
  try {
    spec = JSON.parse(clean);
  } catch {
    return null;
  }
  spec.generation = {
    prompt,
    model: 'claude-haiku-4-5-20251001',
    rationale: spec.generation?.rationale ?? '',
    variantIndex: variantIndex - 1,
  };
  return spec;
}

/**
 * Generates 3 AdSpec variants in parallel (Bold, Elegant, Warm).
 * Returns array of 3 elements; failed slots are null.
 */
export async function generateVariants(
  prompt: string,
  brandTokens: ActiveBrandForPrompt | null | undefined
): Promise<(AdSpec | null)[]> {
  const baseSystem =
    brandTokens != null
      ? SYSTEM_PROMPT_RULES + '\n\n' + getBrandTokensPromptBlock(brandTokens.name, brandTokens.tokens) + SYSTEM_PROMPT_SCHEMA
      : SYSTEM_PROMPT;

  const results = await Promise.all(
    VARIANT_STYLE_SUFFIXES.map((suffix, index) => {
      const systemPrompt = baseSystem + '\n\n' + suffix;
      return generateAdSpecWithCustomSystem(prompt, systemPrompt, index);
    })
  );
  return results;
}

async function generateAdSpecWithCustomSystem(
  prompt: string,
  systemPrompt: string,
  variantIndex: number
): Promise<AdSpec | null> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const raw = data.content[0].text;
    const clean = raw.replace(/```json|```/g, '').trim();
    const spec: AdSpec = JSON.parse(clean);
    spec.generation = {
      prompt,
      model: 'claude-haiku-4-5-20251001',
      rationale: spec.generation?.rationale ?? '',
      variantIndex,
    };
    return spec;
  } catch {
    return null;
  }
}
