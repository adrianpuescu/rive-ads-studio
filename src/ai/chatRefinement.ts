/**
 * Chat refinement: updates AdSpec from conversational requests via Anthropic API.
 */

import type { AdSpec } from '../types/ad-spec.schema';
import type { BrandTokens } from '../types/brand-tokens';
import { getBrandTokensPromptBlock } from '../types/brand-tokens';
import type { ChatMessage } from '../types/chat';

const ADSPEC_SCHEMA = `
AdSpec interface:
{
  version?: string;
  id?: string;
  createdAt?: string;
  template: { id: string; artboard: string; stateMachine: string };
  format?: { size: AdSize; durationMs?: number; loop: boolean };
  text: {
    headline?: { value: string };
    subheadline?: { value: string };
    body?: { value: string };
    cta?: { value: string };
    tagline?: { value: string };
    custom?: Record<string, { value: string }>;
  };
  colors: { primary: string; secondary: string; background: string; accent?: string };
  assets?: Record<string, string>;
  stateInputs: { speed?: number; intensity?: number; mood?: string; custom?: Record<string, number | boolean> };
  generation?: { prompt: string; model: string; rationale: string; variantIndex: number };
}
AdSize = { preset: 'leaderboard' | 'rectangle' | 'skyscraper' | 'square' } | { width: number; height: number };
`;

const SYSTEM_PROMPT = `You are an AI art director for luxury digital ads. You have generated an ad spec and the user wants to refine it. Given the current AdSpec and the user's refinement request, return an updated AdSpec JSON.

Current AdSpec schema:
${ADSPEC_SCHEMA}

Rules:
- Only modify fields the user explicitly asks to change
- Preserve all other fields exactly as-is
- Return ONLY a JSON object with two keys:
  {
    "updatedSpec": <full AdSpec object>,
    "explanation": <one sentence describing what changed>
  }
- No markdown fences, no preamble`;

export interface RefineResult {
  updatedSpec: AdSpec;
  explanation: string;
}

/**
 * Build Anthropic messages array from chat history and current refinement request.
 */
function buildMessages(
  currentSpec: AdSpec,
  messages: ChatMessage[],
  userMessage: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const out: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  if (messages.length === 0) {
    out.push({
      role: 'user',
      content: `Current spec: ${JSON.stringify(currentSpec)}\n\nRequest: ${userMessage}`,
    });
    return out;
  }

  const firstUser = messages[0];
  out.push({
    role: 'user',
    content: `Current spec: ${JSON.stringify(currentSpec)}\n\nRequest: ${firstUser.content}`,
  });

  for (let i = 1; i < messages.length; i++) {
    const msg = messages[i];
    out.push({ role: msg.role, content: msg.content });
  }

  out.push({ role: 'user', content: userMessage });
  return out;
}

/**
 * Refines the current AdSpec using chat history and a new user message.
 */
export async function refineAdSpec(
  currentSpec: AdSpec,
  messages: ChatMessage[],
  userMessage: string,
  apiKey: string,
  brandTokens?: BrandTokens | null
): Promise<RefineResult> {
  const apiMessages = buildMessages(currentSpec, messages, userMessage);

  const systemPrompt =
    brandTokens != null
      ? getBrandTokensPromptBlock(brandTokens) + '\n\n' + SYSTEM_PROMPT
      : SYSTEM_PROMPT;

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
      max_tokens: 1500,
      system: systemPrompt,
      messages: apiMessages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Refinement API failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const raw = data.content[0].text;
  const clean = raw.replace(/```json|```/g, '').trim();

  let parsed: { updatedSpec: AdSpec; explanation: string };
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error(`AI returned invalid JSON: ${clean.slice(0, 200)}`);
  }

  if (!parsed.updatedSpec || typeof parsed.explanation !== 'string') {
    throw new Error('AI response missing updatedSpec or explanation');
  }

  return { updatedSpec: parsed.updatedSpec, explanation: parsed.explanation };
}
