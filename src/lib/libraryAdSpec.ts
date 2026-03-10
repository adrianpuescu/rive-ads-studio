/**
 * Converts LibraryItem to AdSpec for loading an ad from Creative Library.
 * Uses the same template/format defaults as the AI generator.
 */

import type { AdSpec } from '../types/ad-spec.schema';
import type { LibraryItem } from '../hooks/useLibrary';

/** Payload for adding or updating a library item (no id, createdAt). */
export type LibraryItemPayload = Omit<LibraryItem, 'id' | 'createdAt'>;

/**
 * Converts current AdSpec to library item payload for save (add/update).
 */
export function adSpecToLibraryItemPayload(spec: AdSpec): LibraryItemPayload {
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

export function libraryItemToAdSpec(item: LibraryItem): AdSpec {
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
      headline: { value: item.headline },
      subheadline: { value: item.subheadline },
      cta: { value: item.cta },
    },
    stateInputs: {
      speed: 1,
      intensity: 0.5,
      mood: 'dreamy',
    },
    colors: {
      primary: item.colors.primary,
      secondary: item.colors.secondary,
      background: item.colors.background,
      headlineColor: item.colors.headlineColor ?? '#111827',
      subheadlineColor: item.colors.subheadlineColor ?? '#4b5563',
      ctaColor: item.colors.ctaColor ?? '#ffffff',
    },
    generation: {
      prompt: item.prompt,
      model: '',
      rationale: '',
      variantIndex: 0,
    },
  };
}
