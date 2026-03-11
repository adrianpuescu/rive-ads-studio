/**
 * Converts Ad to AdSpec for loading an ad from Projects.
 * Uses the same template/format defaults as the AI generator.
 */

import type { AdSpec } from '../types/ad-spec.schema';
import type { Ad } from '../hooks/useAds';

/** Payload for adding or updating an ad (no id, createdAt). */
export type AdPayload = Omit<Ad, 'id' | 'createdAt'>;

/**
 * Converts current AdSpec to ad payload for save (add/update).
 */
export function adSpecToAdPayload(spec: AdSpec): AdPayload {
  return {
    headline: spec.text?.headline?.value ?? '',
    subheadline: spec.text?.subheadline?.value ?? '',
    cta: spec.text?.cta?.value ?? '',
    colors: {
      background: spec.colors?.background ?? '#ffffff',
      primary: spec.colors?.primary ?? '#000000',
      secondary: spec.colors?.secondary ?? '#666666',
      headlineColor: spec.colors?.headlineColor,
      subheadlineColor: spec.colors?.subheadlineColor,
      ctaColor: spec.colors?.ctaColor,
    },
    prompt: spec.generation?.prompt ?? '',
    chatHistory: [],
  };
}

export function adToAdSpec(ad: Ad): AdSpec {
  return {
    version: '1.0',
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    template: {
      id: 'test-template',
      artboard: 'Banner 728x90',
      stateMachine: 'State Machine 1',
    },
    format: {
      size: { preset: 'leaderboard' },
      durationMs: 5000,
      loop: true,
    },
    text: {
      headline: { value: ad.headline },
      subheadline: { value: ad.subheadline },
      cta: { value: ad.cta },
    },
    stateInputs: {
      speed: 1,
      intensity: 0.5,
      mood: 'dreamy',
    },
    colors: {
      primary: ad.colors.primary,
      secondary: ad.colors.secondary,
      background: ad.colors.background,
      headlineColor: ad.colors.headlineColor ?? '#111827',
      subheadlineColor: ad.colors.subheadlineColor ?? '#4b5563',
      ctaColor: ad.colors.ctaColor ?? '#ffffff',
    },
    generation: {
      prompt: ad.prompt,
      model: '',
      rationale: '',
      variantIndex: 0,
    },
  };
}
