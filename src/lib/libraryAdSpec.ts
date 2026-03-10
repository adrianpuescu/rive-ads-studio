/**
 * Converts LibraryItem to AdSpec for loading an ad from Creative Library.
 * Uses the same template/format defaults as the AI generator.
 */

import type { AdSpec } from '../types/ad-spec.schema';
import type { LibraryItem } from '../hooks/useLibrary';

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
      headlineColor: '#111827',
      subheadlineColor: '#4b5563',
      ctaColor: '#ffffff',
    },
    generation: {
      prompt: item.prompt,
      model: '',
      rationale: '',
      variantIndex: 0,
    },
  };
}
